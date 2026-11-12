import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import http from 'http'; // <-- Import http
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { walletRouter } from './routes/wallet.js';
import { paymentsRouter } from './routes/payments.js';
import { tradingRouter } from './routes/trading.js';
import { marketRouter } from './routes/market.js';
import { adminRouter } from './routes/admin.js';
import { runMatchingEngine } from './providers/broker/engine.js';
import { runDigitEngine } from './providers/broker/digitEngine.js';
import { runBinaryEngine } from './providers/broker/binaryEngine.js';
import { startPriceStream } from './ws/priceStream.js'; // <-- Import WebSocket
import { runDerivEngine } from './providers/broker/derivEngine.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/trading', tradingRouter);
app.use('/api/market', marketRouter);
app.use('/api/admin', adminRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Create HTTP server from Express app
const server = http.createServer(app);

// Start WebSocket Stream
startPriceStream(server);

server.listen(env.API_PORT, () => {
  console.log(`🚀 API running on http://localhost:${env.API_PORT}`);
  
  setInterval(runMatchingEngine, 5000);
  setInterval(runDigitEngine, 2000);
  setInterval(runBinaryEngine, 5000);
  setInterval(runDerivEngine, 3000); // Runs every 3 seconds
  
console.log('📈 Deriv Rise/Fall Engine Started');
  console.log('⚙️ Matching Engine Started');
  console.log('🎲 Digit Engine Started');
  console.log('⚖️ Binary Engine Started');
});
