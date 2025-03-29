import style from "@/app/app/trade/[symbol]/page.module.css";
import useMarketData from "@/hooks/useMarketData";
import useOrders from "@/hooks/useOrders";
import { roundToDecimals } from "@/utils/number";
import { Order, Position } from "@prisma/client";
import { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";

export default function AssetsInformation({positions} : {positions: Position[]}) {
    const [tab, setTab] = useState<"open" | "history" | "assets">("open");
    const { orders, isLoading } = useOrders();

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
                            orders.filter((order) => order.status === "OPEN").length === 0 ? <span className="mx-auto my-auto">No data available</span> : <>
                                <Row className="smaller">
                                    <Col lg={2}>
                                        Symbol
                                    </Col>
                                </Row>
                                {
                                    orders.filter((order) => order.status === "OPEN").map((order) => (
                                        <OrderItem key={order.id} order={order} />
                                    ))
                                }</>
                        )
                }
            </div>
            {/* History Orders Tab */}
            <div className={`d-flex flex-column flex-grow-1 py-3 px-3 overflow-auto ${style.fullBordered} ${style.assetsContent} ${tab == "history" ? "" : "d-none"}`}>
                {
                    isLoading ?
                        <span className="mx-auto my-auto">Loading...</span> :
                        (
                            orders.filter((order) => order.status === "FILLED").length === 0 ? <span className="mx-auto my-auto">No data available</span> : <>
                                <Row className="smaller text-secondary mb-2">
                                    <Col lg={2}>
                                        Symbol
                                    </Col>
                                    <Col lg={2}>
                                        Order time
                                    </Col>
                                    <Col lg={2}>
                                        Side
                                    </Col>
                                    <Col lg={2}>
                                        Price
                                    </Col>
                                    <Col lg={2}>
                                        Total amount
                                    </Col>
                                    <Col lg={2}>
                                        Status
                                    </Col>
                                </Row>
                                {
                                    orders.filter((order) => order.status === "FILLED").map((order) => (
                                        <OrderItem key={order.id} order={order} />
                                    ))
                                }</>
                        )
                }
            </div>
            {/* Assets tab */}
            <div className={`d-flex flex-column flex-grow-1 py-3 px-3 overflow-auto ${style.fullBordered} ${style.assetsContent} ${tab == "assets" ? "" : "d-none"}`}>
                {
                    positions.length === 0 ? <span className="mx-auto my-auto">No assets available</span> : <>
                        <Row className="smaller text-secondary mb-2">
                            <Col lg={2}>
                                Symbol
                            </Col>
                            <Col lg={2}>
                                Quantity
                            </Col>
                            <Col lg={2}>
                                Average cost price
                            </Col>
                            <Col lg={2}>
                                Current Price
                            </Col>
                            <Col lg={2}>
                                Value
                            </Col>
                            <Col lg={2}>
                                Unrealized PNL
                            </Col>
                        </Row>
                        {
                            positions.map((position) => (
                                <PositionItem key={position.id} position={position} />
                            ))
                        }
                    </>
                }
            </div>
        </div>
    );
}

function OrderItem({ order }: { order: Order }) {
    const [assets, setAssets] = useState({
        baseAsset: "...",
        quoteAsset: "...",
    });
    useEffect(() => {
        fetch("/api/market/data?symbol=" + order.symbol)
            .then((res) => res.json())
            .then((data) => {
                setAssets(data);
            })
            .catch((error) => {
                console.error("Error fetching market data:", error)
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    return (
        <Row className="small py-1 mb-2 d-flex align-items-center">
            <Col lg={2} className="fw-semibold">
                <span>{assets.baseAsset + "/" + assets.quoteAsset}</span>
            </Col>
            <Col lg={2} className="smaller">
                <div>{new Date(order.createdAt).toLocaleDateString("en-uk")}</div>
                <div>{new Date(order.createdAt).toLocaleTimeString("en-uk")}</div>
            </Col>
            <Col lg={2}>
                <span className={order.side == "BUY" ? "text-success" : "text-danger"}>{order.side}</span>
            </Col>
            <Col lg={2} className="smaller">
                <div>{roundToDecimals(order.price!, 5)}</div>
                <div>{order.type == "MARKET" ? order.type : order.stopPrice}</div>
            </Col>
            <Col lg={2}>
                <span>{order.quantity + " " + assets.baseAsset}</span>
            </Col>
            <Col lg={2}>
                <span>{order.status}</span>
            </Col>
        </Row>
    );
}

function PositionItem({ position }: { position: Position }) {
    const { price, asset, isLoading } = useMarketData(position.symbol);
    
    const currentValue = isLoading ? 0 : position.quantity * price!;
    const entryValue = position.quantity * position.averageBuyPrice;
    const pnl = currentValue - entryValue;
    const pnlPercentage = entryValue > 0 ? (pnl / entryValue) * 100 : 0;
    
    return (
        <Row className="small py-1 mb-2 d-flex align-items-center">
            <Col lg={2} className="fw-semibold">
                <span>{asset.baseAsset + "/" + asset.quoteAsset}</span>
            </Col>
            <Col lg={2}>
                <span>{roundToDecimals(position.quantity, 8)} {asset.baseAsset}</span>
            </Col>
            <Col lg={2}>
                <span>{roundToDecimals(position.averageBuyPrice, 5)}</span>
            </Col>
            <Col lg={2}>
                <span>{roundToDecimals(isLoading ? -1 : price!, 5)}</span>
            </Col>
            <Col lg={2}>
                <span>{roundToDecimals(currentValue, 2)} {asset.quoteAsset}</span>
            </Col>
            <Col lg={2}>
                <span className={pnl >= 0 ? "text-success" : "text-danger"}>
                    {roundToDecimals(pnl, 2)} ({roundToDecimals(pnlPercentage, 2)}%)
                </span>
            </Col>
        </Row>
    );
}