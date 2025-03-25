'use client';
import TradingContext from "@/contexts/TradingContext";
import useMarketData from "@/hooks/useMarketData";
import { bigNumberFormat } from "@/utils/number";
import { CandlestickSeries, ColorType, createChart, UTCTimestamp, ISeriesApi } from "lightweight-charts";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { MdAutoGraph } from "react-icons/md";

export default function Page() {
    const router = useRouter()
    const { symbol } = useParams<{ symbol: string }>();
    const { asset, price, change, changePercent, isLoading, volume, high, low, imageUrl } = useMarketData(symbol as string);
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
                    <Col xs={12} lg={7} className="px-0">
                        <CandleStickChart symbol={symbol} />
                    </Col>
                    <Col xs={12} lg={5} className="">
                        2
                    </Col>
                </Row>
            </Container>
        </TradingContext.Provider>
    );
}

function CoinInformationBar() {
    const { price, low, high, imageUrl, isLoading, asset, changePercent, volume } = useContext(TradingContext)!;
    return (
        <Container fluid className="d-flex align-items-center gap-4 px-4 py-3 overflow-x-auto"
            style={{
                borderTop: "2px solid #2E2E2E",
                borderBottom: "2px solid #2E2E2E"
            }}>
            <div className="d-flex align-items-center gap-1">
                {imageUrl && <Image
                    src={imageUrl!}
                    className="me-2"
                    alt="coin logo"
                    width={24}
                    height={24}
                />}
                <div className="fw-semibold me-1">
                    {isLoading ? "..." : (asset.baseAsset + "/" + asset.quoteAsset)}
                </div>
                <div className="smaller text-theme fw-bold">10x</div>
            </div>
            <div>
                <div className={`small fw-bold ${changePercent >= 0 ? "text-success" : "text-danger"}`}>
                    {isLoading ? "..." : price.toLocaleString("en-us", { minimumFractionDigits: 2 })}
                </div>
                <div className={`smaller fw-bold ${changePercent >= 0 ? "text-success" : "text-danger"}`}>
                    {isLoading ? "..." : ((changePercent > 0 ? "+" : "") + changePercent.toFixed(2) + "%")}
                </div>
            </div>
            <div className="smaller">
                <div className="text-secondary">24h high</div>
                <div>{isLoading ? "..." : high.toLocaleString("en-us")}</div>
            </div>
            <div className="smaller">
                <div className="text-secondary">24h low</div>
                <div>{isLoading ? "..." : low.toLocaleString("en-us")}</div>
            </div>
            <div className="smaller">
                <div className="text-secondary">24h volume (USDT)</div>
                <div>{isLoading ? "..." : bigNumberFormat(volume)}</div>
            </div>
            <div className="ms-auto small d-flex">
                <MdAutoGraph className="fs-5 me-1" />
                Trading data
            </div>
        </Container>
    );
}

type CandleStick = {
    open: number;
    high: number;
    low: number;
    close: number;
    time: UTCTimestamp;
}

function CandleStickChart({ symbol }: { symbol: string }) {
    const {
        backgroundColor = '#121212',
        textColor = 'grey',
    } = {};

    const [data, setData] = useState<CandleStick[]>([]);
    const [interv, _] = useState<string>('1s');
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

    const fetchDataFromBinance = () => {
        fetch(`https://api.binance.com/api/v3/klines?${new URLSearchParams({ symbol, interval: interv })}`)
            .then(res => res.json())
            .then((data) => {
                const formattedData = data.map((e: number[]) => ({
                    time: e[0] / 1000 as UTCTimestamp,
                    open: Number(e[1]),
                    high: Number(e[2]),
                    low: Number(e[3]),
                    close: Number(e[4])
                }));
                
                setData(formattedData);
                
                if (seriesRef.current) {
                    seriesRef.current.setData(formattedData);
                }
            })
            .catch((error) => {
                console.error("Error fetching market data:", error);
            });
    };

    useEffect(() => {
        if (symbol === "") return;
        
        fetchDataFromBinance();
        
        const inter = setInterval(fetchDataFromBinance, 1000);
        return () => {
            clearInterval(inter);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interv, symbol]);

    useEffect(() => {
        if (!chartContainerRef.current) return;
        
        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: backgroundColor },
                textColor,
            },
            width: chartContainerRef.current.clientWidth,
            height: 500,
            grid: {
                horzLines: {
                    color: "#343434",
                    visible: true,
                },
                vertLines: {
                    color: "#343434",
                    visible: true,
                },
            },
        });
        
        chart.applyOptions({
            timeScale: {
                timeVisible: true,
                secondsVisible: true,
            },
        });

        const newSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#25A750',
            downColor: '#CA3F64',
            borderVisible: false,
            wickUpColor: '#25A750',
            wickDownColor: '#CA3F64'
        });

        if (data.length > 0) {
            newSeries.setData(data);
        }

        chartRef.current = chart;
        seriesRef.current = newSeries;

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
                seriesRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [backgroundColor, textColor]);

    return (
        // TODO: Add interval selector
        <div
            ref={chartContainerRef}
        />
    );
}