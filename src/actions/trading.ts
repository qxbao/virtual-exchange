'use server';
import { verifySession } from "@/lib/dal";
import { LimitOrderFormSchema, MarketOrderFormSchema, OrderState } from "@/lib/definition";
import { getMarketData } from "@/lib/market";
import prisma from "@/lib/prisma";
import { executeOrder } from "@/lib/trading";
import { OrderType } from "@prisma/client";

export async function createOrder(state: OrderState, formData: FormData) {
    const session = await verifySession();
    const uid = session!.id;
    
    const orderType = (formData.get("orderType") as string).toUpperCase();
    let validation;
    if (orderType == OrderType.LIMIT) {
        validation = await LimitOrderFormSchema.safeParseAsync({
            symbol: formData.get("symbol"),
            type: orderType,
            side: (formData.get("orderSide") as string).toUpperCase(),
            quantity: Number(formData.get("quantity")),
            stopPrice: Number(formData.get("stopPrice")),
        });
    } else if (orderType === OrderType.MARKET ) {
        validation = await MarketOrderFormSchema.safeParseAsync({
            symbol: formData.get("symbol"),
            type: orderType,
            side: (formData.get("orderSide") as string).toUpperCase(),
            quantity: Number(formData.get("quantity")),
        });
    }
    
    if (!validation!.success) {
        console.log(validation!.error.flatten().fieldErrors);
        return {
          error: validation!.error.flatten().fieldErrors,
        }
    }

    const marketData = await getMarketData(validation!.data.symbol);
    const price = marketData!.price;

    if (validation?.data.side == "BUY") {
        const user = await prisma.user.findUnique({
            where: { id: Number(uid) },
            select: { balance: true },
        });
        const estimatedCost = validation!.data.type === 'MARKET' 
              ? marketData!.price * validation!.data.quantity 
              : (validation!.data.stopPrice || price)! * validation!.data.quantity;
        if (!user || user.balance < estimatedCost) {
            return {
                message: 'Insufficient balance',
                isErr: true,
            };
        }
    }

    if (validation?.data.side == "SELL") {
        const position = await prisma.position.findUnique({
            where: {
                userId_symbol: {
                    userId: Number(uid),
                    symbol: marketData!.symbol,
                },
            },
        });
        
        if (!position || position.quantity < validation!.data.quantity) {
            return {
                message: 'Insufficient shares to sell',
                isErr: true,
            };
        }
    }

    const order = await prisma.order.create({
        data: {
            userId: Number(uid),
            symbol: marketData!.symbol,
            quantity: validation!.data.quantity,
            price: price,
            stopPrice: validation!.data.stopPrice,
            type: orderType as OrderType,
            side: validation!.data.side,
            status: "OPEN",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
    });

    if (validation!.data.type === OrderType.MARKET) {
        try {
            const trade = await executeOrder(order.id);
            
            if (trade) {
                return {
                    message: "Market order executed successfully!",
                    isErr: false,
                }
            }
        } catch (executeError) {
            console.error('Error executing market order:', executeError);
            return {
                message: "Error executing market order: " + executeError,
                isErr: true,
            }
        }
    }

    return {
        message: "Order created successfully!",
        isErr: false,
    }
} 