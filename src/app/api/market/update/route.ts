import { updateMarketData, updateSpecialFieldsMarketData } from "@/lib/market";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

let isExecuting = false;

export async function POST(req: NextRequest) {
    if (isExecuting) return NextResponse.json({ message: "Already executing" }, { status: 429 });
    isExecuting = true;
    try {
        const body = await req.json();
        const { secret } = body;
        if (!secret || secret !== process.env.SOCKET_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const dataList = await prisma.marketData.findMany({
            select: {
                symbol: true,
            },
        });
        if (dataList.length === 0) await updateMarketData();
        else await updateMarketData(dataList.map((data) => data.symbol));
        await updateSpecialFieldsMarketData();
        return NextResponse.json({
            message: "Market data initialized/fetched",
        });
    } catch (error) {
        console.error("Error fetching:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    } finally {
        isExecuting = false;
    }
}
