import { updateMarketData, updateSpecialFieldsMarketData } from "@/lib/market";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(_: NextRequest) {
    try {
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
    }
}
