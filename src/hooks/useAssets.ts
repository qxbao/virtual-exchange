import { useState, useEffect } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { Position } from "@prisma/client";

export default function useTrading() {
    const [positions, setPositions] = useState<Position[]>([]);
    const [totalValue, setTotalValue] = useState(0);
    const [balance, setBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const { socket } = useSocket();

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                const response = await fetch("/api/trading/positions");
                if (response.ok) {
                    const data = await response.json();
                    setPositions(data);
                }

                const balanceResponse = await fetch("/api/users/balance");
                if (balanceResponse.ok) {
                    const balanceData = await balanceResponse.json();
                    setBalance(balanceData.balance);
                }
            } catch (error) {
                console.error("Error fetching portfolio:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPortfolio();

        const positionsValue = positions.reduce(
            (sum, pos) => sum + pos.currentValue,
            0
        );
        
        setTotalValue(positionsValue + balance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    return { positions, totalValue, balance, isLoading };
}
