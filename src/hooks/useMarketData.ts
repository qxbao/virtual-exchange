import { useSocket } from "@/contexts/SocketContext";
import { getMarketData } from "@/lib/market";
import { MarketData } from "@prisma/client";
import { useState, useEffect } from "react";

export default function useMarketData(symbol: string) {
    const [price, setPrice] = useState<number | null>(null);
    const [change, setChange] = useState<number>(0);
    const [changePercent, setChangePercent] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const { socket, subscribeToMarket, unsubscribeFromMarket } = useSocket();

    useEffect(() => {
        if (!symbol) return;

        const fetchInitialData = async () => {
            try {
                const marketData = await getMarketData(symbol);
                setPrice(marketData.price);
            } catch (error) {
                console.error("Error fetching market data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();

        subscribeToMarket([symbol]);

        if (socket) {
            const handlePriceUpdate = (data: MarketData) => {
                if (data.symbol === symbol) {
                    setPrice(data.price);
                    setChange(data.change);
                    setChangePercent(data.changePercent);
                }
            };

            socket.on("market-update", handlePriceUpdate);

            return () => {
                socket.off("market-update", handlePriceUpdate);
                unsubscribeFromMarket([symbol]);
            };
        }
    }, [symbol, socket, subscribeToMarket, unsubscribeFromMarket]);

    return { price, change, changePercent, isLoading };
}
