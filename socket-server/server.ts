import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

const app = express();
const PORT = process.env.SOCKET_PORT || 4000;

app.use(cors({
  origin: process.env.NEXTJS_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NEXTJS_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.get('/health', (req, res) => {
  res.status(200).send('Socket server is running');
});

app.post('/emit', (req, res) => {
  try {
    const { room, event, data, secret } = req.body;
    
    if (secret !== process.env.SOCKET_SECRET) {
        res.status(401).json({ error: 'Unauthorized' }).send();
    } else {
        if (room) {
          io.to(room).emit(event, data);
        } else {
          io.emit(event, data);
        }
        res.status(200).json({ success: true }).send();
    }
    
  } catch (error) {
    console.error('Error emitting event:', error);
    res.status(500).json({ error: 'Failed to emit event' }).send();
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('authenticate', (data) => {
    if (data.userId) {
      socket.join(`user:${data.userId}`);
      console.log(`User ${data.userId} authenticated with socket ${socket.id}`);
    }
  });

  socket.on('subscribe-market', (symbols) => {
    if (Array.isArray(symbols)) {
      symbols.forEach(symbol => {
        socket.join(`market:${symbol}`);
      });
      console.log(`Socket ${socket.id} subscribed to: ${symbols.join(', ')}`);
    }
  });

  socket.on('unsubscribe-market', (symbols) => {
    if (Array.isArray(symbols)) {
      symbols.forEach(symbol => {
        socket.leave(`market:${symbol}`);
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});

cron.schedule('*/3 * * * * *', async () => {
  await fetch(`${process.env.NEXTJS_URL}/api/market/update`, {
    method: 'POST',
    headers: {
      "Content-Type": 'application/json',
    },
    body: JSON.stringify({ secret: process.env.SOCKET_SECRET })
  });
  await fetch(`${process.env.NEXTJS_URL}/api/trading/orders/scan`, {
    method: 'POST',
    headers: {
      "Content-Type": 'application/json',
    },
    body: JSON.stringify({ secret: process.env.SOCKET_SECRET })
  });
  
  console.log('Market data updated at:', new Date().toISOString());
});