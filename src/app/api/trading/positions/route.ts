import { verifySession } from "@/lib/dal";
import { getMarketData } from "@/lib/market";
import prisma from "@/lib/prisma";
import { Position } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET (request: NextRequest) {
    const session = await verifySession();
    if (!session || !session.id) return NextResponse.json({ message: "Unauthorized"}, { status: 401 });
    const symbol = request?.nextUrl?.searchParams.get('symbol');
    let symbols: string[];
    try {
        if (!symbol) symbols = [];
        else symbols = symbol.split(',');
        const positions = await getPositions(Number(session.id), symbols);
        await fetchPositions(positions);
        return NextResponse.json(await getPositions(Number(session.id), symbols), { status: 200 });
    } catch (e) {
        console.error("Error fetching positions:", e);
        return NextResponse.json({ error: "Failed to fetch positions" }, { status: 500 });
    }
}

const getPositions = async (userId: number, symbols: string[]) => {
    const positions = await prisma.position.findMany({
        where: {
            userId,
            symbol: {
                in: symbols
            }
        }
    });
    return positions;
}

const fetchPositions = async (positions: Position[]) => {
    await Promise.all(positions.map(async (position) => {
        try {
            const data = await getMarketData(position.symbol);
            const currentPrice = data.price;
            const currentValue = position.quantity * data.price;
            const unrealizedPnL = currentValue - (position.quantity * position.averageBuyPrice);
            await prisma.position.update({
                where: {
                    id: position.id
                },
                data: {
                    currentPrice,
                    currentValue,
                    unrealizedPnL
                },
            });
        } catch (e) {
            console.error(`Error updating position for ${position.symbol}:`, e);
            throw e;
        }
    }));
}