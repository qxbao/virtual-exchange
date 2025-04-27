import { useState, useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { Order, Prisma, Trade } from "@prisma/client";

export default function useOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { socket } = useSocket();

    useEffect(() => {
        const fetchOrders = async () => {
            const response = await fetch("/api/trading/orders")
                .then(res => {
                    if (!res.ok) throw new Error("Failed to fetch orders");
                    return res.json();
                })
                .then((data: Prisma.OrderGetPayload<{ include: { trade: true } }>[]) => {
                    setOrders(data);
                    const tempTrades: Trade[] = [];
                    for (const order of data) {
                        if (order.trade) {
                            tempTrades.push(order.trade);
                        }
                    }
                    setTrades(tempTrades);
                    return true;
                })
                .catch(err => {
                    console.error("Error fetching orders:", err);
                    return false;
                });
            if (response) setIsLoading(false);
            else {
                setIsLoading(true);
                return setTimeout(() => fetchOrders(), 1000);
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

            const handleTradeCreated = (trade: Trade) => {
                setTrades((prevTrades) => [trade, ...prevTrades])
            }

            socket.on("order-created", handleOrderCreated);
            socket.on("order-updated", handleOrderUpdated);
            socket.on("order-deleted", handleOrderDeleted);
            socket.on("trade-executed", handleTradeCreated);
            return () => {
                socket.off("order-created", handleOrderCreated);
                socket.off("order-updated", handleOrderUpdated);
                socket.off("trade-executed", handleTradeCreated);
                socket.off("order-deleted", handleOrderDeleted);
            };
        }
    }, [socket]);


    return { orders, isLoading, trades };
}
