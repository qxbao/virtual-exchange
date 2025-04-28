import { getMarketData } from "@/lib/market";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const symbol = request?.nextUrl?.searchParams.get('symbol');
    if (!symbol) return NextResponse.json({ message: "Missing parameter symbol" }, { status: 500 });
    try {
        const cachedData = await prisma.marketData.findUnique({
            select: {
                id: true,
                symbol: true,
            },
            where: {
                symbol
            },
        }); 
        if (!cachedData)
            return NextResponse.json({ message: "Symbol not found" }, { status: 404 });
        const data = await getMarketData(cachedData.symbol);
        if (!data) return NextResponse.json({ message: "Market data not found" }, { status: 404 });
        const { price, name } = data;
        return NextResponse.json({ price, name, symbol }, { status: 200 });
    } catch (error) {
        console.error("Error fetching symbols:", error);
        return NextResponse.json({ error: "Failed to fetch symbols" }, { status: 500 });
    }
}
