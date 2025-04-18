import { OrderSide, OrderStatus } from "@prisma/client";
import prisma from "./prisma";
import { getMarketData } from "./market";
import { emitToUser } from "./socket";

export async function executeOrder(orderId: number) {
    try {
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
            },
            include: {
                marketData: true,
            }
        });

        if (!order || order.status !== OrderStatus.OPEN) {
            throw new Error('Order not found or not in open status');
        }

        const marketData = await getMarketData(order.marketData.symbol);
        if (!marketData) {
            throw new Error('Market data not found' + order.symbol);
        }
        let executionPrice = marketData.price;

        if (order.type === 'LIMIT' || order.type === "STOP") executionPrice = order.price!;
        const feeRate = 0.001; // 0.1%
        const feeQuantity = order.quantity * feeRate;
        const effectiveQuantity = order.side === OrderSide.BUY 
            ? order.quantity - feeQuantity 
            : order.quantity;
        const totalValue = order.quantity * executionPrice;
        
        const result = await prisma.$transaction(async (tx) => {
            const trade = await tx.trade.create({
                data: {
                    userId: order.userId,
                    orderId: order.id,
                    symbol: order.symbol,
                    side: order.side,
                    quantity: order.quantity,
                    price: executionPrice,
                    total: totalValue,
                    fee: feeQuantity,
                },
            });

            const newOrderData = {
                status: OrderStatus.FILLED,
                executedAt: new Date(),
            };

            const updatedOrder = await tx.order.update({
                where: { id: order.id },
                data: newOrderData,
            });
            
            if (order.side == OrderSide.BUY) {
                await tx.user.update({
                    where: {
                        id: order.userId
                    },
                    data: {
                        balance: {
                            decrement: totalValue
                        }
                    }
                });
            } else {
                await tx.user.update({
                    where: {
                        id: order.userId
                    },
                    data: {
                        balance: {
                            increment: totalValue * (1 - feeRate)
                        }
                    }
                });
            }

            const existingPosition = await tx.position.findUnique({
                where: {
                    userId_symbol: {
                        userId: order.userId,
                        symbol: order.symbol
                    }
                }
            })

            if (order.side == OrderSide.BUY) {
                if (existingPosition) {
                    const newQuantity = existingPosition.quantity + effectiveQuantity;
                    const newAverageBuyPrice = ( 
                            (existingPosition.averageBuyPrice * existingPosition.quantity) + (effectiveQuantity * executionPrice)
                        ) / newQuantity;
                    const newPos = await tx.position.update({
                        where: {
                            userId_symbol: {
                                userId: order.userId,
                                symbol: order.symbol
                            }
                        },
                        data: {
                            quantity: newQuantity,
                            averageBuyPrice: newAverageBuyPrice,
                            updatedAt: new Date()
                        }
                    });
                    emitToUser(order.userId, 'position-update', newPos)
                } else {
                    await tx.position.create({
                        data: {
                            userId: order.userId,
                            symbol: order.symbol,
                            quantity: effectiveQuantity,
                            averageBuyPrice: executionPrice,
                        },
                    });
                }
            } else {
                if (!existingPosition || existingPosition.quantity < order.quantity) {
                    throw new Error('Insufficient quantity to sell');
                }

                const newQuantity = existingPosition.quantity - order.quantity;
                const realizedPnL = order.quantity * (executionPrice - existingPosition.averageBuyPrice);
                if (newQuantity > 0) {
                    const newPos = await tx.position.update({
                        where: {
                            userId_symbol: {
                                userId: order.userId,
                                symbol: order.symbol
                            }
                        },
                        data: {
                            quantity: newQuantity,
                            realizedPnL: {
                                increment: realizedPnL
                            },
                            updatedAt: new Date()
                        }
                    });
                    emitToUser(order.userId, 'position-update', newPos)
                } else {
                    await tx.position.delete({
                        where: {
                            userId_symbol: {
                                userId: order.userId,
                                symbol: order.symbol
                            }
                        }
                    });
                    emitToUser(order.userId, 'position-delete', {
                        userId: order.userId,
                        symbol: order.symbol
                    })

                }
            }

            await tx.notification.create({
                data: {
                    userId: order.userId,
                    type: 'ORDER_FILLED',
                    title: 'Order Filled',
                    message: `Your ${order.side} order for ${order.quantity} ${order.symbol} has been filled at ${executionPrice.toFixed(2)}. Fee: ${feeQuantity.toFixed(8)} ${order.symbol}.`
                }
            });
            return {updatedOrder, trade};
        });

        const { updatedOrder, trade } = result;
        await emitToUser(updatedOrder.userId, 'order-updated', updatedOrder);
        await emitToUser(updatedOrder.userId, 'trade-executed', trade);
        const position = await prisma.position.findUnique({
            where: {
              userId_symbol: {
                userId: updatedOrder.userId,
                symbol: updatedOrder.symbol
              }
            }
        });

        if (position) {
            await emitToUser(updatedOrder.userId, 'position-update', position);
        }

        const user = await prisma.user.findUnique({
            where: { id: updatedOrder.userId },
            select: { id: true, balance: true }
        });
        
        if (user) {
            await emitToUser(user.id, 'balance-update', {
            userId: user.id,
            balance: user.balance
            });
        }
        return trade;
    } catch (error) {
        console.error('Error executing order:', error);
        throw error;
    }
}