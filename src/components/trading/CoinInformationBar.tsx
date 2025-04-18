import TradingContext from "@/contexts/TradingContext";
import { bigNumberFormat } from "@/lib/number";
import { useContext } from "react";
import { Container } from "react-bootstrap";
import { MdAutoGraph } from "react-icons/md";
import Image from "next/image";
import style from "@/app/app/trade/[symbol]/page.module.css";

export default function CoinInformationBar() {
    const { price, low, high, imageUrl, isLoading, asset, changePercent, volume } = useContext(TradingContext)!;
    return (
        <Container fluid className={`d-flex align-items-center gap-4 px-4 py-3 overflow-x-auto ${style.bordered}`}>
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
            <div className="smaller no-wrap">
                <div className="text-secondary">24h high</div>
                <div>{isLoading ? "..." : high.toLocaleString("en-us")}</div>
            </div>
            <div className="smaller no-wrap">
                <div className="text-secondary">24h low</div>
                <div>{isLoading ? "..." : low.toLocaleString("en-us")}</div>
            </div>
            <div className="smaller no-wrap">
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