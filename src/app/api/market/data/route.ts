import { getMarketData } from "@/lib/market";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const symbol = request.nextUrl?.searchParams.get("symbol");
    if (symbol) {
        try {
            const data = await getMarketData(symbol);
            if (!data) {
                return NextResponse.json({ error: "Symbol not found" }, { status: 404 });
            }
            return NextResponse.json(data, { status: 200 });
        } catch (error) {
            console.error("Error fetching symbol:", error);
            return NextResponse.json({ error: "Failed to fetch symbol" }, { status: 500 });
        }
    } else {
        return NextResponse.json({ error: "No symbol provided" }, { status: 400 });
    }
}