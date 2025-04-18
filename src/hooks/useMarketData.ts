'use client';
import { useSocket } from "@/contexts/SocketContext";
import { MarketData } from "@prisma/client";
import { useState, useEffect } from "react";

export default function useMarketData(symbol: string) {
    const [price, setPrice] = useState<number | null>(null);
    const [change, setChange] = useState<number>(0);
    const [changePercent, setChangePercent] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [name, setName] = useState<string>("");
    const [marketCap, setMarketCap] = useState<number>(0);
    const [volume, setVolume] = useState<number>(0);
    const [high, setHigh] = useState<number>(0);
    const [low, setLow] = useState<number>(0)
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [asset, setAsset] = useState({
        baseAsset: "XXX",
        quoteAsset: "YYY",
    });
    const { socket, subscribeToMarket, unsubscribeFromMarket } = useSocket();

    useEffect(() => {
        if (!symbol) return;
        console.log(symbol);
        const fetchInitialData = async () => {
            fetch("/api/market/data?symbol=" + symbol)
                .then((res) => res.json())
                .then((marketData: MarketData) => {
                    setPrice(marketData.price);
                    setChangePercent(marketData.changePercent);
                    setChange(marketData.change);
                    setAsset({
                        baseAsset: marketData.baseAsset,
                        quoteAsset: marketData.quoteAsset,
                    });
                    setVolume(marketData.volume);
                    setName(marketData.name as string);
                    setImageUrl(marketData.imageUrl as string);
                    setHigh(marketData.high!);
                    setLow(marketData.low!);
                    setIsLoading(false);
                }).catch(error => {
                    console.error("Error fetching market data:", error);
                    return setTimeout(() => {
                        fetchInitialData();
                    }, 1000);
                });
        };
        fetchInitialData();

        subscribeToMarket([symbol]);

        if (socket) {
            const handlePriceUpdate = (data: MarketData) => {
                if (data.symbol === symbol) {
                    setPrice(data.price);
                    setChange(data.change); 
                    setVolume(data.volume);
                    setChangePercent(data.changePercent);
                    setMarketCap(data.marketCap!);
                    setHigh(data.high!);
                    setLow(data.low!);
                }
            };

            socket.on("market-update", handlePriceUpdate);

            return () => {
                socket.off("market-update", handlePriceUpdate);
                unsubscribeFromMarket([symbol]);
            };
        }
    }, [socket, subscribeToMarket, symbol, unsubscribeFromMarket]);

    return { asset, price, change, changePercent, isLoading, marketCap, volume, name, imageUrl, high, low };
}
