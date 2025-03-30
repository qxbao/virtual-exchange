import style from "@/app/app/trade/[symbol]/page.module.css";
import TradingContext from "@/contexts/TradingContext";
import { numberFormatRouter, roundToDecimals } from "@/lib/number";
import { useContext, useEffect, useState, useRef } from "react";
import { IoMdArrowDown, IoMdArrowUp } from "react-icons/io";

export interface SocketResponse {
    e: string
    E: number
    s: string
    U: number
    u: number
    b: string[][]
    a: string[][]
  }
  

export default function OrderBook ({ symbol }: { symbol: string }) {
    const [bids, setBids] = useState<[string, string][]>([]);
    const [asks, setAsks] = useState<[string, string][]>([]);
    const [priceDirection, setPriceDirection] = useState<'up' | 'down'>('up');
    const previousPriceRef = useRef<number | null>(null);
    const {asset} = useContext(TradingContext)!;
    const [maxAmount, setMaxAmount] = useState(0);
    // Calculate middle price
    const middlePrice = asks.length > 0 && bids.length > 0 ? 
        (parseFloat(asks[0][0]) + parseFloat(bids[0][0])) / 2 : null;

    // Calculate maxAmount whenever bids or asks change
    useEffect(() => {
        // Calculate total amounts for asks
        const askTotals = asks.slice(0, 10).map((_, i, arr) => 
            arr.slice(0, i + 1).reduce((sum, [_, qty]) => sum + parseFloat(qty), 0)
        );
        
        // Calculate total amounts for bids
        const bidTotals = bids.slice(0, 10).map((_, i, arr) => 
            arr.slice(0, i + 1).reduce((sum, [_, qty]) => sum + parseFloat(qty), 0)
        );
        
        // Combine all totals and find the maximum
        const allTotals = [...askTotals, ...bidTotals];
        const max = allTotals.length > 0 ? Math.max(...allTotals) : 0;
        
        setMaxAmount(max);
    }, [bids, asks]);

    // Update price direction when middle price changes
    useEffect(() => {
        if (middlePrice !== null) {
            if (previousPriceRef.current === null) {
                setPriceDirection('up');
            } else if (middlePrice >= previousPriceRef.current) {
                setPriceDirection('up');
            } else if (middlePrice < previousPriceRef.current) {
                setPriceDirection('down');
            }
            
            previousPriceRef.current = middlePrice;
        }
    }, [middlePrice]);

    useEffect(() =>  {
        let ws: WebSocket | null = null;
        let reconnectTimeout: NodeJS.Timeout | null = null;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        const baseReconnectDelay = 1000; // Start with 1 second delay
        
        const connectWebSocket = () => {
            if (ws) {
                ws.close();
            }
            
            ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth`);
            let lastUpdateId = -1;
            const eventBuffer: SocketResponse[] = [];
            let orderBookInitialized = false;
            
            const initializeOrderBook = async () => {
                // Reset state
                lastUpdateId = -1;
                orderBookInitialized = false;
                eventBuffer.length = 0;
                
                // Fetch the snapshot
                let snapshotValid = false;
                while (!snapshotValid) {
                    try {
                        const response = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol.toUpperCase()}&limit=1000`);
                        const snapshot = await response.json();
                        
                        setBids(snapshot.bids);
                        setAsks(snapshot.asks);
                        lastUpdateId = snapshot.lastUpdateId;
                        snapshotValid = true;
                        
                        // Process buffered events
                        for (const bufferedEvent of eventBuffer) {
                            if (bufferedEvent.u <= lastUpdateId) {
                                // Skip events older than or equal to the snapshot
                                continue;
                            }
                            
                            if (bufferedEvent.U <= lastUpdateId + 1 && bufferedEvent.u >= lastUpdateId + 1) {
                                // Process valid events within range
                                processDepthUpdate(bufferedEvent);
                            }
                        }
                        
                        orderBookInitialized = true;
                    } catch (error) {
                        console.error("Error fetching order book snapshot:", error);
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retrying
                    }
                }
            };
            
            const processDepthUpdate = (data: SocketResponse) => {
                // Update bids
                setBids(prevBids => {
                    const newBids = [...prevBids];
                    
                    // Apply bid updates
                    for (const [price, quantity] of data.b) {
                        const index = newBids.findIndex(bid => bid[0] === price);
                        if (parseFloat(quantity) === 0) {
                            // Remove price level
                            if (index !== -1) {
                                newBids.splice(index, 1);
                            }
                        } else {
                            // Update or add price level
                            if (index !== -1) {
                                newBids[index] = [price, quantity];
                            } else {
                                newBids.push([price, quantity]);
                            }
                        }
                    }
                    
                    // Sort bids in descending order by price
                    return newBids.sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])).slice(0, 10);
                });
                
                // Update asks
                setAsks(prevAsks => {
                    const newAsks = [...prevAsks];
                    
                    // Apply ask updates
                    for (const [price, quantity] of data.a) {
                        const index = newAsks.findIndex(ask => ask[0] === price);
                        if (parseFloat(quantity) === 0) {
                            // Remove price level
                            if (index !== -1) {
                                newAsks.splice(index, 1);
                            }
                        } else {
                            // Update or add price level
                            if (index !== -1) {
                                newAsks[index] = [price, quantity];
                            } else {
                                newAsks.push([price, quantity]);
                            }
                        }
                    }
                    
                    // Sort asks in ascending order by price
                    return newAsks.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])).slice(0, 10);
                });
                
                // Update the last update ID
                lastUpdateId = data.u;
            };

            ws.addEventListener("open", () => {
                console.log("Connected to Binance Depth WebSocket");
                // Reset reconnect attempts on successful connection
                reconnectAttempts = 0;
            });

            ws.addEventListener("error", (error) => {
                console.error("WebSocket error:", error);
                if (reconnectAttempts < maxReconnectAttempts) {
                    const delay = Math.min(30000, baseReconnectDelay * Math.pow(2, reconnectAttempts));
                    console.log(`Attempting to reconnect in ${delay/1000} seconds...`);
                    
                    reconnectTimeout = setTimeout(() => {
                        reconnectAttempts++;
                        connectWebSocket();
                    }, delay);
                } else {
                    console.error("Maximum reconnection attempts reached. Please refresh the page.");
                }
            });
            
            ws.addEventListener("message", async(event) => {
                const data = JSON.parse(event.data);
                
                if (!orderBookInitialized) {
                    // Buffer the event if order book isn't initialized yet
                    eventBuffer.push(data);
                    
                    if (lastUpdateId === -1) {
                        // Get the first event's update ID range start
                        lastUpdateId = data.U;
                        
                        // Initialize the order book with snapshot
                        await initializeOrderBook();
                    }
                } else {
                    // Regular processing for subsequent events
                    if (data.u < lastUpdateId) {
                        // Ignore events with last update ID less than our local order book
                        return;
                    }
                    
                    if (data.U > lastUpdateId + 1) {
                        // If first update ID is greater than our local order book update ID,
                        // something went wrong - restart the process
                        console.log("Order book sync lost, restarting...");
                        eventBuffer.push(data);
                        await initializeOrderBook();
                        return;
                    }
                    
                    // Process the event as it's in the correct sequence
                    processDepthUpdate(data);
                }
            });
            
            ws.addEventListener("close", () => {
                console.log("Disconnected from Binance Depth WebSocket");
                
                // Try to reconnect with exponential backoff
                if (reconnectAttempts < maxReconnectAttempts) {
                    const delay = Math.min(30000, baseReconnectDelay * Math.pow(2, reconnectAttempts));
                    console.log(`Attempting to reconnect in ${delay/1000} seconds...`);
                    
                    reconnectTimeout = setTimeout(() => {
                        reconnectAttempts++;
                        connectWebSocket();
                    }, delay);
                } else {
                    console.error("Maximum reconnection attempts reached. Please refresh the page.");
                }
            });
            
            ws.addEventListener("error", (error) => {
                console.error("WebSocket error:", error);
            });
        };
        
        // Initial connection
        connectWebSocket();
        
        // Cleanup function
        return () => {
            if (ws) {
                ws.close();
            }
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
        };
    },  [symbol])
    
    return (
        <div className="d-flex flex-column h-100">
            <div className={`d-flex py-2 px-3 flex-shrink-1 overflow-x-auto ${style.fullBordered} ${style.titleBar}`}>
                <div className="small fw-semibold py-1">
                    Order book
                </div>
            </div>
            <div className={`d-flex flex-column flex-grow-1 py-2 ${style.fullBordered}`}>
                <div className="d-flex py-1 px-3 smaller text-secondary">
                    <div className="col-4 text-start">{`Price (${asset.quoteAsset})`}</div>
                    <div className="col-4 text-end">{`Amount (${asset.baseAsset})`}</div>
                    <div className="col-4 text-end">{`Total (${asset.baseAsset})`}</div>
                </div>
                <div className="flex-grow-1 overflow-auto">
                    <div className="d-flex flex-column-reverse">
                        {asks.slice(0, 10).map(([price, amount], i, arr) => {
                            const totalAmount = arr.slice(0, i + 1).reduce((sum, [_, qty]) => sum + parseFloat(qty), 0);
                            return (
                                <OrderBar 
                                    key={`ask-${i}`} 
                                    price={price} 
                                    amount={amount} 
                                    total={totalAmount} 
                                    maxAmount={maxAmount}
                                    color={"#dc3545"}
                                />
                            );
                        })}
                    </div>
                    <div className={`py-1 px-3 fw-semibold fs-5 ${
                        priceDirection === 'up' ? 'text-success' : 
                        priceDirection === 'down' ? 'text-danger' : ''
                    }`}>
                        {
                            middlePrice !== null ? 
                            <div className="d-flex align-items-center">
                                {
                                    roundToDecimals(middlePrice, 5)
                                }  
                                {
                                    priceDirection === 'up' ?
                                        <IoMdArrowUp/> :
                                        <IoMdArrowDown/>
                                }
                            </div> :
                            <div className="text-secondary small">Loading...</div>
                        }
                    </div>
                    <div className="d-flex flex-column">
                        {bids.slice(0, 10).map(([price, amount], i, arr) => {
                            const totalAmount = arr.slice(0, i + 1).reduce((sum, [_, qty]) => sum + parseFloat(qty), 0);
                            return (
                                <OrderBar 
                                    key={`bid-${i}`} 
                                    price={price} 
                                    amount={amount} 
                                    total={totalAmount} 
                                    maxAmount={maxAmount}
                                    color={"#25a750"}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

function OrderBar({ price, amount, total, maxAmount, color }: { 
    price: string, 
    amount: string, 
    total: number, 
    maxAmount: number,
    color: string 
}) {
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        barRef.current!.style.transform = `translateX(${100 -  (total / maxAmount * 100)}%)`;
    }, [maxAmount, total])
    return <div className={`d-flex px-3 smaller ${style.orderBar}`}>
        <div className="text-start col-4"  style={{ color }}>
            {
                roundToDecimals(parseFloat(price), 5)
            }
        </div>
        <div className="col-4 text-end">
            {
                numberFormatRouter(Number(amount))
            }
        </div>
        <div className="col-4 text-end">
            {
                numberFormatRouter(Number(total))
            }
        </div>
        <div ref={barRef} className={style.orderBarAmount} style={{background: color}}></div>
    </div>
}