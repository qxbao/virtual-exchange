import {
    PrismaClient,
    Prisma,
    Order,
    OrderStatus,
    User,
    MarketData,
    Position,
    Trade,
} from "@prisma/client";
import { emitMarketUpdate, emitToUser } from "./socket";

const socketExtension = Prisma.defineExtension({
    name: "socketExtension",
    query: {
        $allModels: {
          async $allOperations({
              // @ts-expect-error: __internalParams is not defined, but does exist
                __internalParams: { transaction },
                args,
                query,
                model,
                operation,
            }) {
                let orderPrevStat = null;
                if (model == "Order" && operation == "update") {
                    const obj = await query({
                        where: args.where,
                    });
                    orderPrevStat = (obj as Order)?.status;
                }
                const result = await query(args);
                if (transaction) return result;
                try {
                    switch (model) {
                        case "Order":
                            await handleOrderChanges(
                                operation,
                                result as Order,
                                orderPrevStat
                            );
                            break;

                        case "Position":
                            await handlePositionChanges(
                                operation,
                                result as Position
                            );
                            break;

                        case "MarketData":
                            await handleMarketDataChanges(
                                operation,
                                result as MarketData
                            );
                            break;

                        case "User":
                            if (
                                operation === "update" &&
                                args?.data?.balance !== undefined
                            ) {
                                await handleUserBalanceChanges(result as User);
                            }
                            break;

                        case "Trade":
                            if (operation === "create") {
                                await handleTradeChanges(result as Trade);
                            }
                            break;
                    }
                } catch (error) {
                    console.error(
                        `Error in Prisma extension for ${model}.${operation}:`,
                        error
                    );
                }

                return result;
            },
        },
    },
});

const initPrismaClient = () => {
    return new PrismaClient().$extends(socketExtension);
};

const prisma = initPrismaClient();

const globalForPrisma = global as unknown as { prisma: typeof prisma };

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

async function handleOrderChanges(
    operation: string,
    data: Order,
    orderPrevStat: OrderStatus | null
) {
    if (!data || !data.userId) return;

    switch (operation) {
        case "create":
            await emitToUser(data.userId, "order-created", data);
            break;
        case "update":
            await emitToUser(data.userId, "order-updated", data);
            if (data.status === "FILLED" && orderPrevStat === "OPEN") {
                await emitToUser(data.userId, "order-filled", data);
            }
            break;
        case "delete":
            await emitToUser(data.userId, "order-deleted", data.id);
            break;
    }
}

async function handlePositionChanges(operation: string, data: Position) {
    if (!data || !data.userId) return;

    switch (operation) {
        case "create":
            /* Todo: {Emit position-create event to the user} */
            await emitToUser(data.userId, "position-create", data);
            break;
        case "update":
            await emitToUser(data.userId, "position-update", data);
            break;
        case "delete":
            await emitToUser(data.userId, "position-delete", {
                userId: data.userId,
                symbol: data.symbol,
            });
            break;
    }
}

async function handleMarketDataChanges(operation: string, data: MarketData) {
    if (!data || !data.symbol) return;

    await emitMarketUpdate(data.symbol, data);
}

async function handleUserBalanceChanges(data: User) {
    if (!data || !data.id) return;

    await emitToUser(data.id, "balance-update", {
        userId: data.id,
        balance: data.balance,
    });
}

async function handleTradeChanges(data: Trade) {
    if (!data || !data.userId) return;

    await emitToUser(data.userId, "trade-executed", data);
}

export default (prisma || globalForPrisma.prisma) as PrismaClient;