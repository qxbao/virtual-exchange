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

export async function getMarketData(symbol: string): Promise<MarketData> {
    const cachedData = await prisma.marketData.findUnique({
        where: { symbol },
    });

    if (
        cachedData &&
        Date.now() - cachedData.updatedAt.getTime() < 10 * 1000
    ) {
        return cachedData;
    }
    try {
        const data = await fetchMarketData(symbol);
        return data;
    } catch (e) {
        console.error(e);
        console.error("Failed to fetch market data for", symbol);
        if (cachedData) return cachedData;

        throw new Error(`Unable to get market price for ${symbol}`);
    }
}

export async function initMarketData() {
    const assets = DefaultBaseAssets.map((asset) => `${asset}USDT`);
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
                volume: Number(data.volume),
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
                volume: Number(data.volume),
            },
        });
    }
}

async function fetchMarketData(symbol: string) {
    const response = await fetch(
        "https://api.binance.com/api/v3/ticker/24hr?" +
            new URLSearchParams({
                symbol,
            }),
        {
            headers: { accept: "application/json" },
        }
    );
    const marketData: Binance24HFullResponse = await response.json();
    const result = await prisma.marketData.upsert({
        where: { symbol },
        update: {
            price: Number(marketData.lastPrice),
            change: Number(marketData.priceChange),
            changePercent: Number(marketData.priceChangePercent),
            high: Number(marketData.highPrice),
            low: Number(marketData.lowPrice),
            volume: Number(marketData.volume),
            updatedAt: new Date(),
        },
        create: {
            baseAsset: symbol.split("USDT")[0],
            quoteAsset: "USDT",
            symbol: marketData.symbol,
            price: Number(marketData.lastPrice),
            change: Number(marketData.priceChange),
            changePercent: Number(marketData.priceChangePercent),
            high: Number(marketData.highPrice),
            low: Number(marketData.lowPrice),
            volume: Number(marketData.volume),
        },
    });
    return result;
}
