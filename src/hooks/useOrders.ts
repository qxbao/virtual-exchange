import { useState, useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { Order } from "@prisma/client";

export default function useOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { socket } = useSocket();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch("/api/trading/orders");
                if (response.ok) {
                    const data = await response.json();
                    setOrders(data);
                }
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();

        if (socket) {
            const handleOrderCreated = (order: Order) => {
                setOrders((prevOrders) => [order, ...prevOrders]);
            };

            const handleOrderUpdated = (updatedOrder: Order) => {
                setOrders((prevOrders) =>
                    prevOrders.map((order) =>
                        order.id === updatedOrder.id ? updatedOrder : order
                    )
                );
            };

            const handleOrderDeleted = (orderId: number) => {
                setOrders((prevOrders) =>
                    prevOrders.filter((order) => order.id !== orderId)
                );
            };

            socket.on("order-created", handleOrderCreated);
            socket.on("order-updated", handleOrderUpdated);
            socket.on("order-deleted", handleOrderDeleted);

            return () => {
                socket.off("order-created", handleOrderCreated);
                socket.off("order-updated", handleOrderUpdated);
                socket.off("order-deleted", handleOrderDeleted);
            };
        }
    }, [socket]);

    return { orders, isLoading };
}
