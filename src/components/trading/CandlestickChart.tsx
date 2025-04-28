import { createChart, ISeriesApi, UTCTimestamp, ColorType, CandlestickSeries } from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import style from "@/app/app/trade/[symbol]/page.module.css";

type CandleStick = {
    open: number;
    high: number;
    low: number;
    close: number;
    time: UTCTimestamp;
}

export default function CandleStickChart({ symbol }: { symbol: string }) {
    const {
        backgroundColor = '#121212',
        textColor = 'grey',
    } = {};

    const [data, setData] = useState<CandleStick[]>([]);
    const [interv, setInterv] = useState<string>('1m');
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

    const fetchDataFromBinance = () => {
            fetch(`https://api.binance.com/api/v3/klines?${new URLSearchParams({ symbol, interval: interv })}`)
                .then(res => res.json())
                .then((data) => {
                    const timezoneOffsetMs = new Date().getTimezoneOffset() * 60 * 1000 * -1;                
                    const formattedData = data.map((e: number[]) => ({
                        time: ((e[0] + timezoneOffsetMs) / 1000) as UTCTimestamp,
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
                    console.log("Error fetching market data:", error);
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
                        height: chartContainerRef.current.clientHeight,
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
            setInterval(() => handleResize(), 1000);

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
            <div className="d-flex flex-column h-100">
                <div className={`d-flex py-2 px-1 overflow-x-auto ${style.fullBordered} ${style.titleBar}`}>
                    {['1s', '1m', '5m', '15m', '1h', '4h', '1d', '1w'].map((interval) => (
                        <button
                            key={interval}
                            className={`smaller border-0 px-2 py-1 rounded-1 ${interv === interval ? 'bg-dark' : 'text-secondary bg-transparent'}`}
                            onClick={() => setInterv(interval)}
                        >
                            {interval}
                        </button>
                    ))}
                </div>
                <div className={`overflow-hidden flex-grow-1 ${style.fullBordered}`}
                    ref={chartContainerRef}
                />
            </div>
        );
    }