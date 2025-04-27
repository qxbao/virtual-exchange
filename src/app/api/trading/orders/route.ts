import { verifySession } from "@/lib/dal";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const session = await verifySession();
    if (!session || !session.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const uid = session.id;
    const params = request?.nextUrl?.searchParams;
    const status = params.get('status');
    const symbol = params.get('symbol');
    const limit = params.get('limit') || 20;
    const offset = params.get('offset') || 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {
        userId: Number(uid)
    };

    if (status) filter['status'] = status;
    if (symbol) filter['symbol'] = symbol;

    const order = await prisma.order.findMany({
        where: filter,
        orderBy: [{ createdAt: 'desc' }, {executedAt: 'desc'}],
        take: Number(limit),
        skip: Number(offset),
        include: {
            trade: true,
        }
    })

    return NextResponse.json(order);
}