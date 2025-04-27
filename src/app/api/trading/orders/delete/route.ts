import { verifySession } from "@/lib/dal";
import prisma from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {
    const session = await verifySession();
    if (!session || !session.id)
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const { orderId } = await request.json();
    if (!orderId) return new Response("Order ID is required", { status: 400 });
    const order = await prisma.order.findUnique({
        where: {
            id: orderId,
            userId: Number(session.id),
            status: OrderStatus.OPEN,
        },
    });

    if (!order) {
        return NextResponse.json(
            { message: "Order not found or cannot be deleted." },
            { status: 404 }
        );
    }

    try {
        await deleteOrderById(orderId);
        return NextResponse.json(
            { message: "Order deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting order:", error);
        return NextResponse.json(
            { message: "Failed to delete order" },
            { status: 500 }
        );
    }
}

function deleteOrderById(orderId: number) {
    return prisma.order.delete({
        where: { id: orderId },
    });
}
