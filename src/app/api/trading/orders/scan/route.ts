import prisma from "@/lib/prisma";
import { executeOrder } from "@/lib/trading";
import { MarketData, OrderStatus, OrderType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

let isScanning = false;

export async function POST(request: NextRequest) {
    if (isScanning) {
        isScanning = false;
        return NextResponse.json({ message: "Scanning is already in progress" }, { status: 400 });
    }
    const body = await request.json();
    const { secret } = body;
    if (!secret || secret != process.env.SOCKET_SECRET) {
        isScanning = false;
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    } 
    try {
        const dataList = await prisma.marketData.findMany({});
        const data: {[key: string]: MarketData} = {};
        for (const market of dataList) {
            data[market.symbol] = market;
        }
        const openOrders = await prisma.order.findMany({
            where: {
                status: "OPEN",
            }
        });
        for (const order of openOrders) {
            const mData = data[order.symbol];
            if (order.expiresAt && order.expiresAt < new Date()) {
                console.log({
                    where: {
                        id: order.id,
                    },
                    data: {
                        status: OrderStatus.EXPIRED,
                    }
                });
                await prisma.order.update({
                    where: {
                        id: order.id,
                    },
                    data: {
                        status: OrderStatus.EXPIRED,
                    }
                });
                continue;
            } else {
                if (order.type == OrderType.LIMIT && 
                    (order.side == "BUY" && order.stopPrice! > mData.price ||
                    order.side == "SELL" && order.stopPrice! < mData.price)
                ) {
                    await executeOrder(order.id);
                }
                if (order.type == OrderType.STOP && 
                    (order.side == "BUY" && order.stopPrice! > mData.price && order.limitPrice! < mData.price ||
                    order.side == "SELL" && order.stopPrice! < mData.price && order.limitPrice! > mData.price)
                ) {
                    await executeOrder(order.id);
                }
            }
        }
        return NextResponse.json({ message: "Orders scanned" }, { status: 200 });
    } catch(e) {
        console.error("Error scanning:", e);
        return NextResponse.json({ message: "Failed to scan" }, { status: 500 });
    } finally {
        isScanning = false;
    }
}