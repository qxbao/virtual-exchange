'use client'
import { MarketData } from "@prisma/client";
import { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import Image from "next/image";
import useMarketData from "@/hooks/useMarketData";
import style from "./page.module.css";
import { IoLogoUsd } from "react-icons/io5";

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
                <div className="h1 fw-bold">Markets Overview</div>
                <p>Click on any crypto to start trading</p>
            </div>
            <Row className="text-secondary small fw-bold px-lg-2">
                <div className="col-4">
                    <div>Name</div>
                </div>
                <div className="col-2">
                    <div className="text-end">Price</div>
                </div>
                <div className="col-2">
                    <div className="text-end">24h Change</div>
                </div>
                <div className="col-2">
                    <div className="text-end">24h Volume</div>
                </div>
                <div className="col-2">
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
    const { price, changePercent, isLoading, marketCap, asset, volume } = useMarketData(data.symbol);
    const bigNumberFormat = (num: number) => {
        if (num > 1_000_000_000) {
            return (num / 1_000_000_000).toFixed(2) + "B";
        } else if (num > 1_000_000) {
            return (num / 1_000_000).toFixed(2) + "M";
        } else if (num > 1_000) {
            return (num / 1_000).toFixed(2) + "K";
        }
        return num;
    }
    return (
        <Row className={"py-4 px-lg-2 " + style.coinCard} role="button">
            <Col lg={4}>
                <div className="d-flex align-items-center">
                    <IoLogoUsd size={24} />
                    <span className="fw-semibold me-1">
                        {asset.baseAsset + "/" + asset.quoteAsset}
                    </span>
                    <span className="small text-secondary">Safe</span>
                </div>
            </Col>
            <Col lg={2}>
                <div className="text-end fw-light">
                    {!isLoading && price}
                </div>
            </Col>
            <Col lg={2}>
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
            <Col lg={2}>
                <div className="text-end fw-light">
                    <span className="me-1">$</span>
                    {bigNumberFormat(volume)}
                </div>
            </Col>
            <Col lg={2}>
                <div className="text-end fw-light">
                    <span className="me-1">$</span>
                    {marketCap}
                </div>
            </Col>
        </Row>
    );
}