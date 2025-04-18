import { MarketData } from "@prisma/client";
import prisma from "./prisma";

const DefaultBaseAssets = [
    "BTC",
    "ETH",
    "DOGE",
    "BNB",
    "TRUMP",
    "SOL",
    "XRP",
    "PEPE",
    "SUI",
    "NIL",
];

interface Binance24HFullResponse {
    symbol: string;
    priceChange: string;
    priceChangePercent: string;
    weightedAvgPrice: string;
    prevClosePrice: string;
    lastPrice: string;
    lastQty: string;
    bidPrice: string;
    bidQty: string;
    askPrice: string;
    askQty: string;
    openPrice: string;
    highPrice: string;
    lowPrice: string;
    volume: string;
    quoteVolume: string;
    openTime: number;
    closeTime: number;
    firstId: number;
    lastId: number;
    count: number;
}

export async function getMarketData(symbol: string): Promise<MarketData | null> {
    const cachedData = await prisma.marketData.findUnique({
        where: { symbol },
    });    
    return cachedData;
}

export async function updateMarketData(assets: string[] = DefaultBaseAssets) {
    const symbols = JSON.stringify(assets);
    const response = await fetch(
        "https://api.binance.com/api/v3/ticker/24hr?" +
            new URLSearchParams({
                symbols,
            }),
        {
            headers: { accept: "application/json" },
        }
    );
    const marketData: Binance24HFullResponse[] = await response.json();
    for (const data of marketData) {
        await prisma.marketData.upsert({
            where: { symbol: data.symbol },
            update: {
                price: Number(data.lastPrice),
                change: Number(data.priceChange),
                changePercent: Number(data.priceChangePercent),
                high: Number(data.highPrice),
                low: Number(data.lowPrice),
                volume: Number(data.quoteVolume),
                updatedAt: new Date(),
            },
            create: {
                baseAsset: data.symbol.split("USDT")[0],
                quoteAsset: "USDT",
                symbol: data.symbol,
                price: Number(data.lastPrice),
                change: Number(data.priceChange),
                changePercent: Number(data.priceChangePercent),
                high: Number(data.highPrice),
                low: Number(data.lowPrice),
                volume: Number(data.quoteVolume),
            },
        });
    }
}

export async function updateSpecialFieldsMarketData(){
        const marketData = await prisma.marketData.findMany({
            select: {
                symbol: true,
            },
            where: {
                OR: [
                    {name: null},
                    {marketCap: null},
                    {imageUrl: null},
                ]
            }
        });
        if (marketData.length === 0) return;
        const symbolSet = new Set(marketData.map((data) => data.symbol));
        // Binance's non-public API, might be unstable
        const externalResponse = await fetch(
            "https://www.binance.com/bapi/apex/v1/friendly/apex/marketing/complianceSymbolList"
        );
        const externalData = (await externalResponse.json()).data;
        for (const data of externalData) {
            if (symbolSet.has(data.symbol)) {
                await prisma.marketData.update({
                    where: { symbol: data.symbol },
                    data: {
                        name: data.fullName,
                        marketCap: data.marketCap,
                        imageUrl: data.logo,
                    },
                });
                symbolSet.delete(data.symbol);
                if (symbolSet.size === 0) return;
            }
        }
}