'use client';
import TradingContext from "@/contexts/TradingContext";
import useMarketData from "@/hooks/useMarketData";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import CandleStickChart from "@/components/trading/CandlestickChart";
import CoinInformationBar from "@/components/trading/CoinInformationBar";
import OrderBook from "@/components/trading/OrderBook";
import TradeCard from "@/components/trading/TradeCard";
import useAssets from "@/hooks/useAssets";
import AssetsInformation from "@/components/trading/AssetsInformation";

export default function TradingPage() {
    const router = useRouter()
    const { symbol } = useParams<{ symbol: string }>();
    const { asset, price, change, changePercent, isLoading, volume, high, low, imageUrl } = useMarketData(symbol);
    const { positions, balance, isLoading:isAssetLoading } = useAssets();
    useEffect(() => {
        fetch(`/api/market/list`)
            .then((res) => res.json())
            .then((data) => {
                if (!data.map((e: { symbol: string }) => e.symbol).includes(symbol)) router.push("/app");
            })
            .catch((error) => {
                console.error("Error fetching market data:", error)
                router.push("/app");
            });
    }, [router, symbol]);
    return (
        <TradingContext.Provider value={{ high, low, symbol, asset, price: price as number, change, changePercent, isLoading, volume, imageUrl: imageUrl as string }}>
            <CoinInformationBar />
            <Container fluid>
                <Row>
                    <Col xs={12} lg={6} className="px-0">
                        <CandleStickChart symbol={symbol} />
                    </Col>
                    <Col xs={12} lg={3} className="px-0">
                        <OrderBook symbol={symbol}/>
                    </Col>
                    <Col xs={12} lg={3} className="px-0">
                        <TradeCard
                            symbol={symbol}
                            asset={asset}
                            assetPrice={price!}
                            isLoading={isAssetLoading}
                            positions={positions}
                            balance={balance}
                        />
                    </Col>
                    <Col xs={12} className="px-0">
                        <AssetsInformation
                            positions={positions}
                        />
                    </Col>
                </Row>
            </Container>
        </TradingContext.Provider>
    );
}
