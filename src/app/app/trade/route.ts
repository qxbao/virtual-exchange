import {  NextResponse } from "next/server";

export async function GET() {
    return NextResponse.redirect(process.env.NEXTJS_URL + "/app/trade/BTCUSDT", 307);
}