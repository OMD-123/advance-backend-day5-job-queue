// src/routes/api.ts — REST API for queue management
import { Router, Request, Response, NextFunction } from 'express';
import { queueService } from '../services/queue';
import { authMiddleware, requireRole } from '../middleware/auth';
import { JobData } from '../models/job';

const router = Router();

// Health check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Enqueue a job
router.post('/jobs/:queue', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queue } = req.params;
    const data = req.body as JobData;
    const { priority, delay, repeat } = req.body;

    if (!data || typeof data !== 'object') {
      res.status(400).json({ error: 'Job data (body) is required' });
      return;
    }

    const job = await queueService.addJob(queue, data, { priority, delay, repeat });
    res.status(202).json({
      jobId: job.id,
      queue,
      status: 'enqueued',
      data,
    });
  } catch (err) {
    next(err);
  }
});

// Get job by ID
router.get('/jobs/:queue/:jobId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queue, jobId } = req.params;
    const job = await queueService.getJob(queue, jobId);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }
    const state = await job.getState();
    const progress = job.data;
    res.json({ jobId: job.id, queue, state, progress, data: job.data });
  } catch (err) {
    next(err);
  }
});

// List failed jobs
router.get('/jobs/:queue/failed', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queue } = req.params;
    const failed = await queueService.getFailedJobs(queue);
    res.json({ queue, failed: failed.map(j => ({ id: j.id, failedReason: j.failedReason })) });
  } catch (err) {
    next(err);
  }
});

// Retry all failed jobs
router.post('/jobs/:queue/retry', authMiddleware, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queue } = req.params;
    const count = await queueService.retryFailed(queue);
    res.json({ queue, retried: count });
  } catch (err) {
    next(err);
  }
});

// Queue stats
router.get('/queues/:queue/stats', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queue } = req.params;
    const stats = await queueService.getStats(queue);
    res.json({ queue, stats });
  } catch (err) {
    next(err);
  }
});

// Bulk enqueue
router.post('/jobs/:queue/bulk', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { queue } = req.params;
    const jobs = req.body.jobs as JobData[];
    if (!Array.isArray(jobs) || jobs.length === 0) {
      res.status(400).json({ error: 'jobs[] array is required' });
      return;
    }
    const results = await Promise.all(
      jobs.map(data => queueService.addJob(queue, data))
    );
    res.status(202).json({ enqueued: results.map(j => ({ jobId: j.id, queue })) });
  } catch (err) {
    next(err);
  }
});

export { router };
