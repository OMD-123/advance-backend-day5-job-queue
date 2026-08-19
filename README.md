# ⚡ Day 5 — Distributed Job Queue

**BullMQ + Redis** — priority queuing, retry, dead-letter, scheduled jobs, multi-worker fan-out.

> One project per day. This is **Day 5** of the [advance-backend](https://github.com/OMD-123) series.

---

## 🧠 What it does

A production-ready distributed job queue service with:
- **4 queue types**: `mail`, `analytics`, `notifications`, `export`
- **Priority queuing** — critical jobs jump the line
- **Automatic retry** — exponential backoff, configurable attempts
- **Dead-letter queue** — failed jobs survive for manual inspection
- **Scheduled/repeated jobs** — cron-like patterns via BullMQ repeat
- **Multi-worker concurrency** — parallel processing per queue
- **REST API** — enqueue, inspect, retry, bulk-add from any client

---

## 🏗️ Architecture

```
POST /jobs/:queue     → Enqueue a job
GET  /jobs/:queue/:id → Inspect job state
GET  /queues/:queue/stats → Real-time queue depth
POST /jobs/:queue/retry   → Retry all failed (admin)
POST /jobs/:queue/bulk     → Batch enqueue
```

Workers run as separate processes (or threads) — each registered to one or more queues with configurable concurrency.

---

## ⚙️ Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js + TypeScript (ESNext) |
| Queue engine | BullMQ 5 + ioredis |
| Message broker | Redis |
| HTTP server | Express |
| Auth | JWT (dev-mode decode) |
| Testing | Jest + ts-jest |

---

## 🚀 Run locally

```bash
# 1. Start Redis (Docker)
docker run -d -p 6379:6379 redis:alpine

# 2. Install
npm install

# 3. Run
npm run dev        # dev with hot-reload
npm test           # 45 tests with coverage
npm run build      # production build
npm start          # production server
```

**API will start at** `http://localhost:3000`

---

## 🔐 Auth

All endpoints require `Authorization: Bearer <JWT>`.
In dev mode, any valid 3-part JWT is accepted.

---

## 📂 Key files

```
src/
├── index.ts              # App bootstrap + queue/worker registration
├── config/index.ts       # Env config with defaults
├── models/job.ts         # JobData types (mail, analytics, notification, export)
├── jobs/processors.ts    # Per-queue processor functions
├── services/queue.ts    # QueueService: createQueue, addJob, getStats, retry
├── middleware/auth.ts    # JWT decode middleware + requireRole()
└── routes/api.ts         # REST API routes
tests/
├── job.test.ts           # Type + validation tests
├── auth.test.ts          # Middleware tests
├── processors.test.ts     # Processor unit tests
└── queue.test.ts         # QueueService mocked tests
```

---

## 📊 Tests

```
Test Suites: 4 passed, 4 total
Tests:       45 passed, 45 total
```
