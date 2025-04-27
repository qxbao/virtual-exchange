# VirtualX - Virtual Cryptocurrency Exchange

A risk-free cryptocurrency mock trading platform that provides users with a realistic trading experience without financial risk. Start with 3,000 USDT and receive 100 USDT daily to practice trading strategies.

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Guide](#guide)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)


## Features

- **Real-time Market Data**: Live price updates from Binance API
- **Order Book Visualization**: Real-time order book with bid/ask information
- **Advanced Charts**: Interactive candlestick charts with multiple timeframes
- **Trading Functionality**: Market, limit and stop orders
- **Portfolio Management**: Track positions, orders, and trading history
- **User Authentication**: Secure signup/login system
- **Real-time Updates**: Powered by Socket.io for instant updates

## Technologies

- **Frontend**: React 19, Next.js 15, Bootstrap 5
- **Backend**: Next.js API Routes, Express (Socket Server)
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT with jose
- **Real-time Communication**: Socket.io
- **Others**: TypeScript, Zod validation, bcrypt

## Guide

### Prerequisites

- Node.js (v18+)
- MySQL database
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/qxbao/virtual-exchange.git
cd virtual_exchange
```

2. Install dependencies:

```
npm install
```

3. Set up the database:
```
npm run database
```

4. Start the development server:
```
# In one terminal, start the Next.js app
npm run dev

# In another terminal, start the Socket.io server
npm run socket
```

### Environment Variables
Create a `.env` file in the root directory with the following variables:
```
# Database
DATABASE_URL="mysql://username:password@localhost:3306/<database-name>"

# Authentication
SESSION_SECRET="<your-jwt-secret-key>"

# Socket Server
SOCKET_SERVER_URL="http://localhost:4000"
SOCKET_PORT="4000"
SOCKET_SECRET="<another-secret-key-to-communicate-between-socket-and-nextjs-server>"

# Next.js
NEXTJS_URL="http://localhost:3000"
```