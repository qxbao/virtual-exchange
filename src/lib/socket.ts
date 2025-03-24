/* eslint-disable @typescript-eslint/no-explicit-any */
const { SOCKET_SERVER_URL = "http://localhost:4000", SOCKET_SECRET } =
    process.env;

export async function emitEvent(event: string, data: any, room: string) {
    try {
        await fetch(`${SOCKET_SERVER_URL}/emit`, {
            method: "POST",
            body: JSON.stringify({
                room,
                event,
                data,
                secret: SOCKET_SECRET,
            }),
            headers: {
                "Content-Type": "application/json",
            },
        });
        return true;
    } catch (error) {
        console.error("Error emitting event to socket server:", error);
        return false;
    }
}

export async function emitWithRetry(event: string, data: any, room?: string, maxRetries = 3) {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        await fetch(`${SOCKET_SERVER_URL}/emit`, {
            method: "POST",
            body: JSON.stringify({
                room,
                event,
                data,
                secret: SOCKET_SECRET,
            }),
            headers: {
                "Content-Type": "application/json",
            },
        });
        return true;
      } catch (error) {
        retries++;
        console.error(`Emit attempt ${retries} failed:`, error);
        
        if (retries >= maxRetries) {
          console.error(`Max retries reached for event ${event}`);
          return false;
        }
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retries)));
      }
    }
    
    return false;
}

export async function emitToUser(userId: number, event: string, data: any) {
    return emitEvent(event, data, `user:${userId}`);
}

export async function emitMarketUpdate(symbol: string, data: any) {
    return emitEvent('market-update', {
        symbol,
        ...data
    }, `market:${symbol}`);
}