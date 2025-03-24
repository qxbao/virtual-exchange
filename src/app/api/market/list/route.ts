import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_: NextRequest) {
    try {
        const dataList = await prisma.marketData.findMany({
            select: {
                symbol: true,
            },
            orderBy: {
                volume: "desc",
            },
        });
        return NextResponse.json(dataList);
    } catch (error) {
        console.error("Error fetching symbols:", error);
        return NextResponse.json({ error: "Failed to fetch symbols" }, { status: 500 });
    }
}
