'use client'
import { MarketData } from "@prisma/client";
import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import useMarketData from "@/hooks/useMarketData";
import style from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import { bigNumberFormat } from "@/lib/number";

export default function AuthenticatedHome() {
    const [marketData, setMarketData] = useState<MarketData[]>([]);
    
    useEffect(() => {
        fetch('/api/market/list')
            .then(res => res.json())
            .then(data => {
                setMarketData(data);
            })
            .catch(e => {
                console.error(e);
            });
    }, [])
    return (
        <Container className="py-5">
            <div className="px-lg-2 mb-5">
                <div className="h1 fw-bold">Spot Markets</div>
                <p>Click on any crypto to start trading</p>
            </div>
            <Row className="text-secondary small fw-bold px-lg-2">
                <div className="col-3">
                    <div>Name</div>
                </div>
                <div className="col ms-auto">
                    <div className="text-end d-lg-none">Price/ 24h Change/ 24h Vol/ Market Cap</div>
                    <div className="text-end d-none d-lg-block">Price</div>
                </div>
                <div className="col-2 d-none d-lg-block">
                    <div className="text-end">24h Change</div>
                </div>
                <div className="col-2 d-none d-lg-block">
                    <div className="text-end">24h Volume</div>
                </div>
                <div className="col-2 d-none d-lg-block">
                    <div className="text-end">Market Cap</div>
                </div>
            </Row>
            <div className="my-2">
                {
                    marketData.map((data) => {
                        return (
                            <CoinDisplayCard key={data.symbol} data={data} />
                        );
                    })
                }
            </div>
        </Container>
    );
}

const CoinDisplayCard = ({ data }: { data: MarketData }) => {
    const { price, changePercent, isLoading, asset, volume, name, imageUrl, marketCap } = useMarketData(data.symbol);
    return (
        <Link href="/app/trade/[symbol]" as={`/app/trade/${data.symbol}`}>
            <Row className={"py-4 px-lg-2 " + style.coinCard} role="button">
                <Col lg={4} xs={5}>
                    <div className="d-flex align-items-center">
                        {imageUrl && <Image
                            src={imageUrl!}
                            className="me-2"
                            alt="coin logo"
                            width={24}
                            height={24}
                        />}
                        <span className="me-1">
                            <span className="fw-semibold">{asset.baseAsset}</span>
                            {"/" + asset.quoteAsset}
                        </span>
                        <span className="smaller text-secondary">{name}</span>
                    </div>
                </Col>
                <Col className="d-lg-block d-lg-none">
                    <div className="text-end fw-light">
                        {!isLoading && price!.toLocaleString("en-us", { maximumFractionDigits: 8 })}
                    </div>
                    <div className="text-end fw-bold">
                        {
                            !isLoading && (
                                <span className={changePercent > 0 ? "text-success" : "text-danger"}>
                                    {(changePercent > 0 ? "+" : "") + changePercent.toFixed(2)}%
                                </span>
                            )
                        }
                    </div>
                    <div className="text-end fw-light">
                        ${bigNumberFormat(volume)}
                    </div>
                    <div className="text-end fw-light">
                        ${bigNumberFormat(marketCap)}
                    </div>
                </Col>
                <Col lg={2} className="d-none d-lg-block">
                    <div className="text-end fw-light">
                        {!isLoading && price!.toLocaleString("en-us", { maximumFractionDigits: 8 })}
                    </div>
                </Col>
                <Col lg={2} className="d-none d-lg-block">
                    <div className="text-end fw-bold">
                        {
                            !isLoading && (
                                <span className={changePercent > 0 ? "text-success" : "text-danger"}>
                                    {(changePercent > 0 ? "+" : "") + changePercent.toFixed(2)}%
                                </span>
                            )
                        }
                    </div>
                </Col>
                <Col lg={2} className="d-none d-lg-block">
                    <div className="text-end fw-light">
                        ${bigNumberFormat(volume)}
                    </div>
                </Col>
                <Col lg={2} className="d-none d-lg-block">
                    <div className="text-end fw-light">
                        ${bigNumberFormat(marketCap)}
                    </div>
                </Col>
            </Row>
        </Link>
    );
}