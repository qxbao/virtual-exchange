import { verifySession } from "@/lib/dal"
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await verifySession();
    if (!session || !session.id)
        return NextResponse.json({ message: "Unauthorized"}, { status: 401 });
    const user = await prisma.user.findUnique({
        select: {
            id: true,
            balance: true,
        },
        where: {
            id: Number(session.id),
        }
    });
    if (!user)
        return NextResponse.json({ message: "User not exist"}, { status: 500 });
    return NextResponse.json(user);
}