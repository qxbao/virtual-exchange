import style from "@/app/app/trade/[symbol]/page.module.css";
import { roundToDecimals } from "@/utils/number";
import { OrderType, Position } from "@prisma/client";
import { useState } from "react";
import { Form } from "react-bootstrap";
import { FaDollarSign } from "react-icons/fa6";

export default function TradeCard(
    { symbol, price, asset, positions, balance, isLoading } :
    { symbol: string, price: number, asset: { baseAsset: string, quoteAsset: string }, positions: Position[], balance: number, isLoading: boolean }
) {
    const [amount, setAmount]  = useState<string>("");
    const [orderSide, setOrderSide] = useState<"Buy" | "Sell">('Buy');
    const [orderType, _] = useState<OrderType>('MARKET');
    const createOrder = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (Number(amount) <= 1/price) return alert("Amount must be greater than " + roundToDecimals(1/price, 1));
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
                })
            }).then(async (res) => {
                if (res.ok) return res.json();
                throw new Error((await res.json()).message);
            })
            .then(() => alert("Order created successfully"))
            .catch((error) => alert("Error creating order: " + error.message));
        }
    }
    return (
        <div className="d-flex flex-column h-100">
            <div className={`d-flex py-2 px-3 flex-shrink-1 overflow-x-auto ${style.fullBordered} ${style.titleBar}`}>
                <div className="small fw-semibold py-1">
                    Trade
                </div>
            </div>
            <div className={`d-flex flex-column flex-grow-1 py-3 px-3 ${style.fullBordered}`}>
                <div className="p-1 bg-dark d-flex rounded-1 mb-3">
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
                <div className="smaller text-secondary pb-1">
                    Market
                </div>
                <div className="py-4 border-bottom border-2 border-dark border-top">
                    <div className="mb-3">
                        <label className="mb-1 smaller">{"Price (" + asset.quoteAsset + ")"}</label>
                        <Form.Control className={`bg-dark py-2 ${style.tradeInput}`} placeholder="Place order at market price" disabled/>
                    </div>
                    <div className="mb-3">
                        <label className="mb-1 smaller">{"Amount (" + asset.baseAsset + ")"}</label>
                        <Form.Control
                            className={`bg-dark py-2 ${style.tradeInput}`}
                            type="number"
                            value={amount}
                            onChange={(e) => {
                                if (!isNaN(Number(e.target.value))) setAmount(e.target.value)
                            }}
                            placeholder={`Min ${roundToDecimals(1/price, 1)} ${asset.baseAsset}`}/>
                    </div>
                    <div className="smaller text-secondary">
                        <div className="mb-1">
                            Available: { isLoading ? "..." :(
                                orderSide == "Buy" ? balance : (positions.find((p) => p.symbol === symbol)?.quantity ?? 0)
                            )} { orderSide == "Buy" ? asset.quoteAsset : asset.baseAsset }
                        </div>
                        <div>
                            Max {orderSide.toLowerCase()}: { isLoading ? "..." : 
                                (
                                    orderSide == "Buy" ? ((balance/price) * 0.999).toLocaleString("en-us", {maximumFractionDigits: 6}) : ((positions.find((p) => p.symbol === symbol)?.quantity ?? 0) * price)
                                )
                            } {orderSide == "Buy" ? asset.baseAsset : asset.quoteAsset}
                        </div>
                    </div>
                </div>
                <div>
                    <button
                        className={`btn mb-2 w-100 py-2 text-white rounded-pill fw-bold mt-3 ${orderSide == "Buy" ? "btn-success" : "btn-danger"}`}
                        onClick={createOrder}
                    >
                        <span className="small">{orderSide} {asset.baseAsset}</span>
                    </button>
                    <div className="smaller d-flex text-secondary align-items-center justify-content-center">
                        <FaDollarSign/>
                        Fee: 0.1%
                    </div>
                </div>
            </div>
        </div>
    );

}