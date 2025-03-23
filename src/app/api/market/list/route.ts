import { getMarketData } from "@/lib/market";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest) {
    try {
        const symbols = await prisma.marketData.findMany({
            orderBy: {
                volume: "desc",
            },
        });
        if (symbols.length === 0) {
            for (const symbol of ["bitcoin", "ethereum", "tether-gold", "dogecoin", "the-open-network"])
                await getMarketData(symbol);
            const result = await prisma.marketData.findMany({
                orderBy: {
                    volume: "desc",
                },
            });
            return NextResponse.json(result, { status: 200 });
        } else {
            return NextResponse.json(symbols, {status: 200});
        }   
    } catch (error) {
        console.error("Error fetching symbols:", error);
        return NextResponse.json({ error: "Failed to fetch symbols" }, { status: 500 });
    }
}
