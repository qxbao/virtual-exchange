'use client';
import React, { useEffect, useState, createContext, useContext } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    subscribeToMarket: (symbols: string[]) => void;
    unsubscribeFromMarket: (symbols: string[]) => void;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    subscribeToMarket: () => {},
    unsubscribeFromMarket: () => {}
});

export function SocketProvider({ children, uid } : { children: React.ReactNode, uid: number }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const subscribeToMarket = (symbols: string[]) => {
        if (socket && symbols.length > 0) {
          socket.emit('subscribe-market', symbols);
        }
    }

    const unsubscribeFromMarket = (symbols: string[]) => {
        if (socket && symbols.length > 0) {
          socket.emit('unsubscribe-market', symbols);
        }
    }

    useEffect(() => {
        if (isNaN(uid)) return;
        try {
            const socketInstance = io(
              process.env.SOCKET_SERVER_URL || 'http://localhost:4000',
              {
                reconnectionDelay: 1000,
                reconnection: true,
                reconnectionAttempts: 10,
                transports: ['websocket'],
                autoConnect: true,
              }
            );
    
            socketInstance.on('connect', () => {
                console.log('Connected to socket server');
                setIsConnected(true);
    
                if (uid) {
                    socketInstance.emit('authenticate', { userId: Number(uid) });
                }
            })
    
            socketInstance.on('disconnect', () => {
                console.log('Disconnected from socket server');
                setIsConnected(false);
            });
    
            socketInstance.on('connect_error', (err) => {
                console.log('Socket connection error:', err);
            });
            
            setSocket(socketInstance);
    
            return () => {
                socketInstance.disconnect();
            };
        } catch(e) {
          console.log(e);
        }
    }, [uid]);

    useEffect(() => {
        if (socket && !isNaN(uid)) {
            socket.emit('authenticate', { userId: uid });
        }
    }, [socket, uid]);

    return (
        <SocketContext.Provider 
          value={{ 
            socket, 
            isConnected,
            subscribeToMarket,
            unsubscribeFromMarket
          }}
        >
          {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => useContext(SocketContext);