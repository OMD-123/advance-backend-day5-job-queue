// src/index.ts — App entry point
import express from 'express';
import { config } from './config';
import { router } from './routes/api';
import { queueService } from './services/queue';

const app = express();
app.use(express.json());

// CORS for dev
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  next();
});

app.use('/', router);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: err.message });
});

async function main() {
  // Bootstrap queues + workers for all queue names
  const queueNames = config.queues.map(q => q.name);
  queueNames.forEach(name => {
    try {
      queueService.createQueue(name);
      queueService.createWorker(name);
      queueService.createQueueEvents(name);
      console.log(`✓ Queue + Worker registered: ${name}`);
    } catch (err) {
      console.warn(`⚠ Could not register ${name}:`, (err as Error).message);
    }
  });

  const server = app.listen(config.port, () => {
    console.log(`\n🚀 Job Queue API ready on http://localhost:${config.port}`);
    console.log(`   Health: GET  /health`);
    console.log(`   Enqueue: POST /jobs/:queue`);
    console.log(`   Stats:  GET  /queues/:queue/stats`);
    console.log(`   Queues: ${queueNames.join(', ')}\n`);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down...');
    await queueService.close();
    server.close();
    process.exit(0);
  });
}

main().catch(console.error);
