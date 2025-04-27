import style from "@/app/app/trade/[symbol]/page.module.css";
import { PopupContext } from "@/contexts/PopupContext";
import useMarketData from "@/hooks/useMarketData";
import useOrders from "@/hooks/useOrders";
import { roundToDecimals } from "@/lib/number";
import { MarketData, Order, Position, Trade } from "@prisma/client";
import { CSSProperties, useContext, useEffect, useState } from "react";
import { FaX } from "react-icons/fa6";

const tableStyles: {
    tableContainer: CSSProperties;
    tableRow: CSSProperties;
    tableColumn: CSSProperties;
} = {
    tableContainer: {
        overflowX: 'auto',
        width: '100%'
    },
    tableRow: {
        display: 'flex',
        minWidth: '800px',
        width: '100%'
    },
    tableColumn: {
        flex: '1 0 auto',
        width: '120px',
        padding: '0 8px'
    }
};
export default function AssetsInformation({positions} : {positions: Position[]}) {
    const [tab, setTab] = useState<"open" | "history" | "assets">("open");
    const { orders, trades, isLoading } = useOrders();
    const [marketData, setMarketData] = useState<{[key: string]: MarketData}>({});
    const [isFetching, setIsFetching] = useState(true);
    const {showPopup} = useContext(PopupContext)!;
    useEffect(() => {
        if (orders.length == 0) return;
        const symbolSet = new Set(orders.map((order) => order.symbol));
        const fetchMarketData = async () => {
            if (!isFetching) return;
            setIsFetching(true);
            const marketDataPromises = Array.from(symbolSet).map((symbol) => {
                if (symbol in Object.keys(marketData)) return true;
                return fetch("/api/market/data?symbol=" + symbol)
                    .then((res) => res.json())
                    .then((data) => {
                        setMarketData((prev) => ({
                            ...prev,
                            [symbol]: data,
                        }));
                        return true;
                    })
                    .catch((error) => {
                        console.error("Error fetching market data:", error);
                        showPopup("Error", "Error fetching market data: " + symbol, true, null);
                        return false;
                    });
            });
            const bools = await Promise.all(marketDataPromises);
            if (bools.some(e => e == false)) {
                setTimeout(() => {
                    fetchMarketData();
                }, 1000);
            } else {
                console.log(marketData)
                setIsFetching(false);
            }
        }
        fetchMarketData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orders])

    return (
        <div className="d-flex flex-column h-100">
            <div className={`d-flex py-2 px-3 gap-3 flex-shrink-1 overflow-x-auto ${style.fullBordered} ${style.titleBar}`}>
                <div
                    role="button"
                    className={`small py-1 ${tab == "open" ? "text-white fw-semibold" : "text-secondary"}`}
                    onClick={() => setTab("open")}
                >
                    Open orders ({isLoading ? "..." : orders.filter((order) => order.status === "OPEN").length})
                </div>
                <div
                    role="button"
                    className={`small py-1 ${tab == "history" ? "text-white fw-semibold" : "text-secondary"}`}
                    onClick={() => setTab("history")}
                >
                    History orders
                </div>
                <div
                    role="button"
                    className={`small py-1 ${tab == "assets" ? "text-white fw-semibold" : "text-secondary"}`}
                    onClick={() => setTab("assets")}
                >
                    Assets
                </div>
            </div>
            {/* Open Orders Tab */}
            <div className={`d-flex flex-column flex-grow-1 py-3 px-3 overflow-auto ${style.fullBordered} ${style.assetsContent} ${tab == "open" ? "" : "d-none"}`}>
                {
                    isLoading ?
                        <span className="mx-auto my-auto">Loading...</span> :
                        (
                            orders.filter((order) => order.status === "OPEN").length === -1 ? <span className="mx-auto my-auto">No data available</span> : 
                            <div style={tableStyles.tableContainer}>
                                <div style={tableStyles.tableRow} className="smaller text-secondary mb-2">
                                    <div style={tableStyles.tableColumn}>Symbol</div>
                                    <div style={tableStyles.tableColumn}>Order time</div>
                                    <div style={tableStyles.tableColumn}>Side</div>
                                    <div style={tableStyles.tableColumn}>Price</div>
                                    <div style={tableStyles.tableColumn}>Total amount</div>
                                    <div style={tableStyles.tableColumn}>Action</div>
                                </div>
                                {
                                    orders.filter((order) => order.status === "OPEN").map((order) => (
                                        !isFetching && <OrderItem
                                            marketData={marketData[order.symbol]}
                                            key={"order/" + order.id}
                                            order={order} />
                                    ))
                                }
                            </div>
                        )
                }
            </div>
            {/* History Orders Tab */}
            <div className={`d-flex flex-column flex-grow-1 py-3 px-3 overflow-auto ${style.fullBordered} ${style.assetsContent} ${tab == "history" ? "" : "d-none"}`}>
                {
                    isLoading ?
                        <span className="mx-auto my-auto">Loading...</span> :
                        (
                            trades.length === 0 ? <span className="mx-auto my-auto">No data available</span> : 
                            <div style={tableStyles.tableContainer}>
                                <div style={tableStyles.tableRow} className="smaller text-secondary mb-2">
                                    <div style={tableStyles.tableColumn}>Symbol</div>
                                    <div style={tableStyles.tableColumn}>Order time</div>
                                    <div style={tableStyles.tableColumn}>Side</div>
                                    <div style={tableStyles.tableColumn}>Price</div>
                                    <div style={tableStyles.tableColumn}>Total amount</div>
                                    <div style={tableStyles.tableColumn}>Status</div>
                                </div>
                                {
                                    trades.map((trade) => (
                                        !isFetching && <TradeItem
                                            key={"trade/" + trade.id}
                                            trade={trade}
                                            marketData={marketData[trade.symbol]}
                                            />
                                    ))
                                }
                            </div>
                        )
                }
            </div>
            {/* Assets tab */}
            <div className={`d-flex flex-column flex-grow-1 py-3 px-3 overflow-auto ${style.fullBordered} ${style.assetsContent} ${tab == "assets" ? "" : "d-none"}`}>
                {
                    positions.length === 0 ? <span className="mx-auto my-auto">No assets available</span> : 
                    <div style={tableStyles.tableContainer}>
                        <div style={tableStyles.tableRow} className="smaller text-secondary mb-2">
                            <div style={tableStyles.tableColumn}>Symbol</div>
                            <div style={tableStyles.tableColumn}>Quantity</div>
                            <div style={tableStyles.tableColumn}>Average cost price</div>
                            <div style={tableStyles.tableColumn}>Current Price</div>
                            <div style={tableStyles.tableColumn}>Value</div>
                            <div style={tableStyles.tableColumn}>Unrealized PNL</div>
                        </div>
                        {
                            positions.map((position) => (
                                <PositionItem key={position.id} position={position} />
                            ))
                        }
                    </div>
                }
            </div>
        </div>
    );
}

function OrderItem({ order, marketData }: { order: Order, marketData: MarketData}) {
    const { showPopup } = useContext(PopupContext)!;
    async function handleCloseOrder() {
        try {
            await fetch("/api/trading/orders/delete", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderId: order.id,
                }),
            });
            showPopup("Success", "Order closed successfully", false, null);
        } catch (error) {
            console.error("Error closing order:", error);
            showPopup("Error", "Error closing order. Try again?", true, () => handleCloseOrder());
        }
    }
    return (
        <div style={tableStyles.tableRow} className="small py-1 mb-2 d-flex align-items-center">
            <div style={tableStyles.tableColumn} className="fw-semibold">
                <span>{marketData.baseAsset + "/" + marketData.quoteAsset}</span>
            </div>
            <div style={tableStyles.tableColumn} className="smaller">
                <div>{new Date(order.createdAt).toLocaleDateString("en-uk")}</div>
                <div>{new Date(order.createdAt).toLocaleTimeString("en-uk")}</div>
            </div>
            <div style={tableStyles.tableColumn}>
                <span className={order.side == "BUY" ? "text-success" : "text-danger"}>{order.side}</span>
            </div>
            <div style={tableStyles.tableColumn} className="smaller">
                <div>{order.type == "MARKET" ? order.type : roundToDecimals(order.stopPrice!, 5)}</div>
            </div>
            <div style={tableStyles.tableColumn}>
                <span>{order.quantity + " " + marketData.baseAsset}</span>
            </div>
            <div style={tableStyles.tableColumn}>
                <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={handleCloseOrder}
                    disabled={order.status !== "OPEN"}
                >
                    <FaX className="me-1"/>
                    Close order
                </button>
            </div>
        </div>
    );
}

function TradeItem({ trade, marketData }: { trade: Trade, marketData: MarketData}) {
    return (
        <div style={tableStyles.tableRow} className="small py-1 mb-2 d-flex align-items-center">
            <div style={tableStyles.tableColumn} className="fw-semibold">
                <span>{marketData.baseAsset + "/" + marketData.quoteAsset}</span>
            </div>
            <div style={tableStyles.tableColumn} className="smaller">
                <div>{new Date(trade.createdAt).toLocaleDateString("en-uk")}</div>
                <div>{new Date(trade.createdAt).toLocaleTimeString("en-uk")}</div>
            </div>
            <div style={tableStyles.tableColumn}>
                <span className={trade.side == "BUY" ? "text-success" : "text-danger"}>{trade.side}</span>
            </div>
            <div style={tableStyles.tableColumn} className="smaller">
                <div>{roundToDecimals(trade.price!, 5)}</div>
            </div>
            <div style={tableStyles.tableColumn}>
                <span>{trade.quantity + " " + marketData.baseAsset}</span>
            </div>
            <div style={tableStyles.tableColumn}>
                <span>Executed</span>
            </div>
        </div>
    );
}

function PositionItem({ position }: { position: Position }) {
    const { price, asset, isLoading } = useMarketData(position.symbol);
    
    const currentValue = isLoading ? 0 : position.quantity * price!;
    const entryValue = position.quantity * position.averageBuyPrice;
    const pnl = currentValue - entryValue;
    const pnlPercentage = entryValue > 0 ? (pnl / entryValue) * 100 : 0;
    
    return (
        <div style={tableStyles.tableRow} className="small py-1 mb-2 d-flex align-items-center">
            <div style={tableStyles.tableColumn} className="fw-semibold">
                <span>{asset.baseAsset + "/" + asset.quoteAsset}</span>
            </div>
            <div style={tableStyles.tableColumn}>
                <span>{roundToDecimals(position.quantity, 8)} {asset.baseAsset}</span>
            </div>
            <div style={tableStyles.tableColumn}>
                <span>{roundToDecimals(position.averageBuyPrice, 5)}</span>
            </div>
            <div style={tableStyles.tableColumn}>
                <span>{roundToDecimals(isLoading ? -1 : price!, 5)}</span>
            </div>
            <div style={tableStyles.tableColumn}>
                <span>{roundToDecimals(currentValue, 2)} {asset.quoteAsset}</span>
            </div>
            <div style={tableStyles.tableColumn} className={pnl >= 0 ? "text-success" : "text-danger"}>
                <span>
                    {roundToDecimals(pnl, 2)} ({roundToDecimals(pnlPercentage, 2)}%)
                </span>
            </div>
        </div>
    );
}