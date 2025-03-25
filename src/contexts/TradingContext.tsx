"use client";
import { createContext } from "react";

type TradingContextType = {
    symbol: string;
    asset: {
        baseAsset: string;
        quoteAsset: string;
    };
    price: number;
    change: number;
    changePercent: number;
    isLoading: boolean;
    volume: number;
    imageUrl: string;
    high: number;
    low: number;
};

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export default TradingContext;