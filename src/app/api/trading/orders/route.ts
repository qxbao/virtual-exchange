import { verifySession } from "@/lib/dal";
import { getMarketData } from "@/lib/market";
import prisma from "@/lib/prisma";
import { executeOrder } from "@/lib/trading";
import { roundToDecimals } from "@/lib/number";
import { OrderSide, OrderType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const session = await verifySession();
    if (!session || !session.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const uid = session.id;
    const params = request?.nextUrl?.searchParams;
    const status = params.get('status');
    const symbol = params.get('symbol');
    const limit = params.get('limit') || 20;
    const offset = params.get('offset') || 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {
        userId: Number(uid)
    };

    if (status) filter['status'] = status;
    if (symbol) filter['symbol'] = symbol;

    const order = await prisma.order.findMany({
        where: filter,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
        include: {
            trades: true,
        }
    })

    return NextResponse.json(order);
}

export async function POST(request: NextRequest) {
    const session = await verifySession();
    if (!session || !session.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const uid = session.id;

    try {

        const body = await request.json();
        const { symbol, type, side, quantity, stopPrice } = body;
    
        if (!symbol || !quantity || !type || !side) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 }); 
        }
        const marketData = await getMarketData(symbol);
        if (!marketData) {
            return NextResponse.json({ message: 'Market data not found: ' + symbol }, { status: 404 });
        }
        const price = marketData!.price;
        if (quantity < 1/price) {
            return NextResponse.json({ message: 'Quantity must be greater than ' + roundToDecimals(1/price, 1) }, { status: 400 });
        }

        if (side == OrderSide.BUY) {
            const user = await prisma.user.findUnique({
                where: { id: Number(uid) },
                select: { balance: true },
            });
    
            const estimatedCost = type === 'MARKET' 
              ? marketData.price * quantity 
              : (price || stopPrice)! * quantity;
    
            if (!user || user.balance < estimatedCost) {
                return NextResponse.json({ message: 'Insufficient balance' }, { status: 400 });
            }
        }
    
        if (side == OrderSide.SELL) {
            const position = await prisma.position.findUnique({
                where: {
                    userId_symbol: {
                        userId: Number(uid),
                        symbol: marketData.symbol,
                    },
                },
            });
            
            if (!position || position.quantity < quantity) {
                return NextResponse.json({ message: 'Insufficient shares to sell' }, { status: 400 });
            }
        }
    
        const order = await prisma.order.create({
            data: {
              userId: Number(uid),
              symbol: marketData.symbol,
              quantity,
              price,
              stopPrice,
              type,
              side,
              status: 'OPEN',
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });
    
        if (type === OrderType.MARKET) {
            try {
                console.log('Executing market order:', order);
                    
                const trade = await executeOrder(order.id);
                
                if (trade) {
                    return NextResponse.json({
                    orderId: order.id,
                    status: 'FILLED',
                    trade,
                    });
                }
            } catch (executeError) {
              console.error('Error executing market order:', executeError);
            }
        }
    
        return NextResponse.json(order);
    } catch (e) {
        console.error('Error creating order:', e);
        return NextResponse.json({ message: 'Error creating order' }, { status: 500 });
    }
}