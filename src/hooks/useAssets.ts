import { useState, useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { Position } from "@prisma/client";

export default function useAssets() {
    const [positions, setPositions] = useState<Position[]>([]);
    const [balance, setBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const { socket } = useSocket();

    useEffect(() => {
        const fetchPortfolio = async () => {
            const portfolioResponse = await fetch("/api/trading/positions").then((res) => {
                if (!res.ok) throw new Error("Error fetching positions");
                return res.json();
            }).then((data) => {
                setPositions(data);
                return true;
            }).catch(error => {
                console.error("Error fetching positions:", error);
                return false;
            });

            if (portfolioResponse === false) return setTimeout(() => {
                fetchPortfolio();
            }, 1000);

            const balanceResponse = await fetch("/api/users/balance")
                .then((res) => {
                    if (!res.ok) throw new Error("Error fetching balance");
                    return res.json();
                }).then((data) => {
                    setBalance(data.balance);
                    return true;
                }).catch(error => {
                    console.error("Error fetching balance:", error);
                    return false;
                });
            
            if (balanceResponse === false) {
                return setTimeout(() => {
                    fetchPortfolio();
                }, 1000);
            }
            setIsLoading(false);
        };

        fetchPortfolio();
    }, [])

    useEffect(() => {
        if (socket) {
            const handlePositionUpdate = (data: Position) => {
                setPositions((prevPositions) => {
                    const index = prevPositions.findIndex(
                        (p) => p.symbol === data.symbol
                    );
                    if (index >= 0) {
                        const updated = [...prevPositions];
                        updated[index] = data;
                        return updated;
                    } else {
                        return [...prevPositions, data];
                    }
                });
            };

            const handlePositionDelete = (data: {
                userId: number;
                symbol: string;
            }) => {
                setPositions((prevPositions) =>
                    prevPositions.filter(
                        (p: Position) => p.symbol !== data.symbol
                    )
                );
            };

            const handleBalanceUpdate = (data: {
                userId: number;
                balance: number;
            }) => {
                setBalance(data["balance"]);
            };

            socket.on("position-update", handlePositionUpdate);
            socket.on("position-delete", handlePositionDelete);
            socket.on("balance-update", handleBalanceUpdate);

            return () => {
                socket.off("position-update", handlePositionUpdate);
                socket.off("position-delete", handlePositionDelete);
                socket.off("balance-update", handleBalanceUpdate);
            };
        }
    }, [socket, positions, balance]);

    return { positions, balance, isLoading };
}
