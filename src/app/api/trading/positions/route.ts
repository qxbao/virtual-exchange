import { verifySession } from "@/lib/dal";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET (request: NextRequest) {
    const session = await verifySession();
    if (!session || !session.id) return NextResponse.json({ message: "Unauthorized"}, { status: 401 });
    const symbol = request?.nextUrl?.searchParams.get('symbol');
    let symbols: string[];
    try {
        if (!symbol) symbols = [];
        else symbols = symbol.split(',');
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
            symbol: symbols.length ? {
                in: symbols
            } : {}
        }
    });
    return positions;
}