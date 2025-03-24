import { OrderSide, OrderStatus } from "@prisma/client";
import prisma from "./prisma";
import { getMarketData } from "./market";
import { emitToUser } from "./socket";

export async function executeOrder(orderId: number) {
    try {
        const order = await prisma.order.findUnique({
            where: {
                id: orderId
            },
            include: {
                marketData: true,
            }
        });

        if (!order || order.status !== OrderStatus.OPEN) {
            throw new Error('Order not found or not in open status');
        }

        const marketData = await getMarketData(order.marketData.id);
        let executionPrice = marketData.price;

        if (order.type === 'LIMIT') executionPrice = order.price!;
        const totalValue = order.quantity * executionPrice;
        const fee = totalValue * 0.001;
        
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
                    fee
                },
            });

            const updatedOrder = await tx.order.update({
                where: {
                    id: order.id
                },
                data: {
                    status: OrderStatus.FILLED,
                    filledQuantity: order.quantity,
                    executedAt: new Date(),
                }
            });

            if (order.side == OrderSide.BUY) {
                tx.user.update({
                    where: {
                        id: order.userId
                    },
                    data: {
                        balance: {
                            decrement: totalValue + fee
                        }
                    }
                });
            } else {
                tx.user.update({
                    where: {
                        id: order.userId
                    },
                    data: {
                        balance: {
                            increment: totalValue - fee
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
                    const newQuantity = existingPosition.quantity + order.quantity;
                    const newAverageBuyPrice = ( 
                            (existingPosition.averageBuyPrice * existingPosition.quantity) + (order.quantity * executionPrice)
                        ) / newQuantity;
                    await tx.position.update({
                        where: {
                            userId_symbol: {
                                userId: order.userId,
                                symbol: order.symbol
                            }
                        },
                        data: {
                            quantity: newQuantity,
                            averageBuyPrice: newAverageBuyPrice,
                            currentPrice: marketData.price,
                            currentValue: newQuantity * marketData.price,
                            unrealizedPnL: (newQuantity * marketData.price) - (newQuantity * newAverageBuyPrice),
                            updatedAt: new Date()
                        }
                    });
                } else {
                    await tx.position.create({
                        data: {
                            userId: order.userId,
                            symbol: order.symbol,
                            quantity: order.quantity,
                            averageBuyPrice: executionPrice,
                            currentPrice: marketData.price,
                            currentValue: order.quantity * marketData.price,
                            unrealizedPnL: 0
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
                    tx.position.update({
                        where: {
                            userId_symbol: {
                                userId: order.userId,
                                symbol: order.symbol
                            }
                        },
                        data: {
                            quantity: newQuantity,
                            currentPrice: marketData.price,
                            currentValue: newQuantity * marketData.price,
                            unrealizedPnL: newQuantity *
                                (marketData.price - existingPosition.averageBuyPrice),
                            realizedPnL: {
                                increment: realizedPnL
                            },
                            updatedAt: new Date()
                        }
                    });
                } else {
                    tx.position.delete({
                        where: {
                            userId_symbol: {
                                userId: order.userId,
                                symbol: order.symbol
                            }
                        }
                    });
                }
            }

            await tx.notification.create({
                data: {
                    userId: order.userId,
                    type: 'ORDER_FILLED',
                    title: 'Order Filled',
                    message: `Your ${order.side} order for ${order.quantity} ${order.symbol} has been filled at ${executionPrice.toFixed(2)}.`
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