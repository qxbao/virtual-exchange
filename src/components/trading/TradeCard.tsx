import style from "@/app/app/trade/[symbol]/page.module.css";
import { PopupContext } from "@/contexts/PopupContext";
import { roundToDecimals } from "@/lib/number";
import { OrderType, Position } from "@prisma/client";
import { useContext, useState } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { FaDollarSign } from "react-icons/fa6";

export default function TradeCard(
    { symbol, assetPrice, asset, positions, balance, isLoading } :
    { symbol: string, assetPrice: number, asset: { baseAsset: string, quoteAsset: string }, positions: Position[], balance: number, isLoading: boolean }
) {
    const [amount, setAmount]  = useState<string>("");
    const [price, setPrice] = useState<string>("");
    const [total, setTotal] = useState<string>("");
    const [orderSide, setOrderSide] = useState<"Buy" | "Sell">('Buy');
    const [orderType, setOrderType] = useState<OrderType>('MARKET');
    const { showPopup } = useContext(PopupContext);
    const fetchOrder = () => {
        if (Number(amount) <= 1/assetPrice) return alert("Amount must be greater than " + roundToDecimals(1/assetPrice, 1));
        if (orderType ==   "MARKET") {
            fetch("/api/trading/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    symbol,
                    type: orderType.toUpperCase(),
                    side: orderSide.toUpperCase(),
                    quantity: Number(amount),
                    stopPrice: price == "" ? undefined : Number(price)
                })
            }).then(async (res) => {
                if (res.ok) return res.json();
                throw new Error((await res.json()).message);
            })
            .then(() => alert("Order created successfully"))
            .catch((error) => alert("Error creating order: " + error.message));
        }
    }

    const el = (<Row className="my-5">
        <Col><div className="fw-bold text-secondary mb-1 small">Price</div><div className="text-black">{orderType=="MARKET" ? "Market" : price}</div></Col>
        <Col><div className="fw-bold text-secondary mb-1 small">Amount</div><div className="text-black">{amount}</div></Col>
        <Col><div className="fw-bold text-secondary mb-1 small">Order type</div><div className="text-black">{orderType}</div></Col>
    </Row>);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        showPopup("Order confirmation", el, false, () => fetchOrder())
    }

    return (
        <div className="d-flex flex-column h-100">
            <div className={`d-flex py-2 px-3 flex-shrink-1 overflow-x-auto ${style.fullBordered} ${style.titleBar}`}>
                <div className="small fw-semibold py-1">
                    Trade
                </div>
            </div>
            <form onSubmit={handleSubmit} className={`d-flex flex-column flex-grow-1 py-3 px-3 ${style.fullBordered}`}>
                <div className="p-1 bg-dark d-flex rounded-1 mb-4">
                    {["Buy", "Sell"].map((e) => {
                        return (
                            <button
                                key={e}
                                className={`border-0 flex-grow-1 smaller bold px-2 py-2 rounded-1 ${orderSide === e ? (e == "Sell" ? "bg-danger" : "bg-success") : 'text-secondary bg-transparent'}`}
                                onClick={() => setOrderSide(e as "Buy" | "Sell")}
                            >
                                {e}
                            </button>
                        );
                    })}
                </div>
                <div className="py-2">
                    <div className="smaller text-secondary pb-1 mb-3 d-flex border-2 border-dark border-bottom">
                        {
                            Object.values(OrderType).map((e) => {
                                return (
                                    <div
                                        key={e}
                                        role="button"
                                        className={`border-0 smaller px-2 rounded-1 ${orderType === e ? 'text-white  fw-semibold' : 'text-secondary'}`}
                                        onClick={() => setOrderType(e as OrderType)}
                                    >
                                        {e}
                                    </div>
                                );
                            })
                        }
                    </div>
                    <div className="mb-3">
                        <label className="mb-1 smaller">{"Price (" + asset.quoteAsset + ")"}</label>
                        <Form.Control
                            className={`bg-dark py-2 ${style.tradeInput}`}
                            value={orderType === "MARKET" ? "" : price }
                            placeholder={orderType === "MARKET" ? "Place order at market assetPrice" : ""}
                            onChange={(e) => {
                                if (!isNaN(Number(e.target.value))) {
                                    setPrice(e.target.value)
                                }
                            }}
                            disabled={orderType === "MARKET"}/>
                    </div>
                    <div className="mb-3">
                        <label className="mb-1 smaller">{"Amount (" + asset.baseAsset + ")"}</label>
                        <Form.Control
                            className={`bg-dark py-2 ${style.tradeInput}`}
                            type="number"
                            value={amount}
                            onChange={(e) => {
                                if (!isNaN(Number(e.target.value))) {
                                    setAmount(e.target.value);
                                    setTotal(e.target.value == "" ? "" : (Number(e.target.value) * assetPrice).toString())
                                }
                            }}
                            placeholder={`Min ${roundToDecimals(1/assetPrice, 1)} ${asset.baseAsset}`}/>
                    </div>
                    <div className={`mb-3 ${orderType == "MARKET" ? "d-none" : ""}`}>
                        <label className="mb-1 smaller">{"Total (" + asset.quoteAsset + ")"}</label>
                        <Form.Control
                            className={`bg-dark py-2 ${style.tradeInput}`}
                            type="number"
                            value={total}
                            onChange={(e) => {
                                if (!isNaN(Number(e.target.value))) {
                                    setTotal(e.target.value)
                                    setAmount(e.target.value == "" ? "" : (Number(e.target.value) / assetPrice).toString())
                                }
                            }}/>
                    </div>
                    <div className="smaller text-secondary mb-4">
                        <div className="mb-1">
                            Available: { isLoading ? "..." :(
                                orderSide == "Buy" ? balance : (positions.find((p) => p.symbol === symbol)?.quantity ?? 0)
                            )} { orderSide == "Buy" ? asset.quoteAsset : asset.baseAsset }
                        </div>
                        <div>
                            Max {orderSide.toLowerCase()}: { isLoading ? "..." : 
                                (
                                    orderSide == "Buy" ? ((balance/assetPrice) * 0.999).toLocaleString("en-us", {maximumFractionDigits: 6}) : ((positions.find((p) => p.symbol === symbol)?.quantity ?? 0) * assetPrice)
                                )
                            } {orderSide == "Buy" ? asset.baseAsset : asset.quoteAsset}
                        </div>
                    </div>
                    <div>
                        <button
                            className={`btn mb-2 w-100 py-2 text-white rounded-pill fw-bold mt-3 ${orderSide == "Buy" ? "btn-success" : "btn-danger"}`}
                        >
                            <span className="small">{orderSide} {asset.baseAsset}</span>
                        </button>
                        <div className="smaller d-flex text-secondary align-items-center justify-content-center">
                            <FaDollarSign/>
                            Fee: 0.1%
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );

}