import { MarketData } from "@prisma/client";
import prisma from "./prisma";

type MarketDataResponse = {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    market_cap_rank: number;
    fully_diluted_valuation: number;
    total_volume: number;
    high_24h: number;
    low_24h: number;
    price_change_24h: number;
    price_change_percentage_24h: number;
    market_cap_change_24h: number;
    market_cap_change_percentage_24h: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
    ath: number;
    ath_change_percentage: number;
    ath_date: string;
    atl: number;
    atl_change_percentage: number;
    atl_date: string;
    roi: string | null;
    last_updated: string;
}[];

export async function getMarketData(id: string): Promise<MarketData> {
    const cachedData = await prisma.marketData.findUnique({
        where: { id },
    });

    if (cachedData && Date.now() - cachedData.updatedAt.getTime() < 5 * 60 * 1000) {
        return cachedData;
    }
    try {
        const data = await fetchMarketData(id);
        return data;
    } catch (e) {
        console.error(e);
        console.error("Failed to fetch market data for", id);
        if (cachedData) return cachedData;
        
        throw new Error(`Unable to get market price for ${id}`);
    }
}

async function fetchMarketData(id: string) {
    const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?" +
            new URLSearchParams({
                ids: id,
                vs_currency: "usd",
                precision: String(4),
                locale: "en",
            }),
        {
            headers: { accept: "application/json" },
        }
    );
    const marketData: MarketDataResponse = await response.json();
    const symbolData = marketData[0];
    const result = await prisma.marketData.upsert({
        where: { id },
        update: {
            price: symbolData.current_price,
            change: symbolData.price_change_24h,
            changePercent: symbolData.price_change_percentage_24h,
            high: symbolData.high_24h,
            low: symbolData.low_24h,
            volume: symbolData.total_volume,
            marketCap: symbolData.market_cap,
            updatedAt: new Date(),
        },
        create: {
            id: symbolData.id,
            name: symbolData.name,
            symbol: symbolData.symbol,
            price: symbolData.current_price,
            change: symbolData.price_change_24h,
            changePercent: symbolData.price_change_percentage_24h,
            high: symbolData.high_24h,
            low: symbolData.low_24h,
            volume: symbolData.total_volume,
            marketCap: symbolData.market_cap,
            imageUrl: symbolData.image,
        },
    });
    return result;
}