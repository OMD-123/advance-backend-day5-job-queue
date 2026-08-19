// src/services/queue.ts — BullMQ queue factory + worker management
import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { config } from '../config';
import { JobData, QueueStats } from '../models/job';
import { processMail, processAnalytics, processNotification, processExport } from '../jobs/processors';

type ProcessorFn = (job: Job) => Promise<unknown>;

const processors: Record<string, ProcessorFn> = {
  [process.env.QUEUE_MAIL ?? 'mail']: processMail,
  [process.env.QUEUE_ANALYTICS ?? 'analytics']: processAnalytics,
  [process.env.QUEUE_NOTIFICATIONS ?? 'notifications']: processNotification,
  [process.env.QUEUE_EXPORT ?? 'export']: processExport,
};

const redisConnection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
};

export class QueueService {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();

  createQueue(name: string): Queue {
    if (this.queues.has(name)) return this.queues.get(name)!;

    const q = new Queue(name, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: config.jwt ? 3 : 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    this.queues.set(name, q);
    return q;
  }

  createWorker(name: string): Worker {
    if (this.workers.has(name)) return this.workers.get(name)!;

    const processor = processors[name];
    if (!processor) throw new Error(`No processor registered for queue: ${name}`);

    const w = new Worker(name, processor, {
      connection: redisConnection,
      concurrency: config.redis.concurrency,
    });

    w.on('failed', (job: Job | undefined, err: Error) => {
      if (job) console.error(`[${name}] Job ${job.id} failed:`, err.message);
    });

    this.workers.set(name, w);
    return w;
  }

  createQueueEvents(name: string): QueueEvents {
    if (this.queueEvents.has(name)) return this.queueEvents.get(name)!;
    const qe = new QueueEvents(name, { connection: redisConnection });
    this.queueEvents.set(name, qe);
    return qe;
  }

  async addJob<T extends JobData>(
    queueName: string,
    data: T,
    opts?: { priority?: number; delay?: number; repeat?: { pattern: string } }
  ): Promise<Job<T>> {
    const queue = this.createQueue(queueName);
    return queue.add(queueName, data, {
      priority: opts?.priority,
      delay: opts?.delay,
      repeat: opts?.repeat,
    });
  }

  async getStats(name: string): Promise<QueueStats> {
    const queue = this.createQueue(name);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed, paused: 0 };
  }

  async getJob(name: string, jobId: string): Promise<Job | undefined> {
    return this.queues.get(name)?.getJob(jobId);
  }

  async getFailedJobs(name: string, start = 0, end = 10): Promise<Job[]> {
    return this.queues.get(name)?.getFailed(start, end) ?? [];
  }

  async retryFailed(name: string): Promise<number> {
    const failed = await this.getFailedJobs(name, 0, 100);
    await Promise.all(failed.map(j => j.retry()));
    return failed.length;
  }

  async close(): Promise<void> {
    await Promise.all(
      [...this.workers.values()].map(w => w.close())
    );
    await Promise.all(
      [...this.queues.values()].map(q => q.close())
    );
    await Promise.all(
      [...this.queueEvents.values()].map(qe => qe.close())
    );
  }
}

export const queueService = new QueueService();
