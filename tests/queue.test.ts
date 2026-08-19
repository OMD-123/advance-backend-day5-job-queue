// tests/queue.test.ts — Queue service unit tests (mocked BullMQ)
jest.mock('bullmq', () => {
  const mockJob = (id: string, data: unknown) => ({
    id,
    data,
    getState: jest.fn().mockResolvedValue('completed'),
    retry: jest.fn().mockResolvedValue(undefined),
  });

  return {
    Queue: jest.fn().mockImplementation((_name: string) => ({
      add: jest.fn().mockResolvedValue(mockJob(`job-${Date.now()}`, {})),
      getWaitingCount: jest.fn().mockResolvedValue(3),
      getActiveCount: jest.fn().mockResolvedValue(1),
      getCompletedCount: jest.fn().mockResolvedValue(42),
      getFailedCount: jest.fn().mockResolvedValue(2),
      getDelayedCount: jest.fn().mockResolvedValue(0),
      getJob: jest.fn().mockResolvedValue(null),
      getFailed: jest.fn().mockResolvedValue([]),
      close: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    })),
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    })),
    QueueEvents: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

import { QueueService } from '../src/services/queue';

describe('QueueService', () => {
  let svc: QueueService;

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new QueueService();
  });

  describe('createQueue', () => {
    it('should create a queue by name', () => {
      const q = svc.createQueue('mail');
      expect(q).toBeDefined();
    });

    it('should return same queue on second call', () => {
      const q1 = svc.createQueue('mail');
      const q2 = svc.createQueue('mail');
      expect(q1).toBe(q2);
    });

    it('should create multiple named queues', () => {
      const q1 = svc.createQueue('analytics');
      const q2 = svc.createQueue('notifications');
      expect(q1).not.toBe(q2);
    });
  });

  describe('createWorker', () => {
    it('should throw if no processor registered', () => {
      expect(() => svc.createWorker('nonexistent')).toThrow('No processor registered');
    });

    it('should create a worker for known queue', () => {
      const w = svc.createWorker('mail');
      expect(w).toBeDefined();
    });
  });

  describe('addJob', () => {
    it('should add a job and return a Job instance', async () => {
      const job = await svc.addJob('mail', {
        to: 'test@example.com',
        subject: 'Hi',
        body: 'Hello',
      });
      expect(job).toBeDefined();
      expect(job.id).toBeTruthy();
    });
  });

  describe('getStats', () => {
    it('should return queue stats', async () => {
      const stats = await svc.getStats('mail');
      expect(stats).toEqual({
        waiting: 3,
        active: 1,
        completed: 42,
        failed: 2,
        delayed: 0,
        paused: 0,
      });
    });
  });

  describe('retryFailed', () => {
    it('should return 0 when no failed jobs', async () => {
      const count = await svc.retryFailed('mail');
      expect(count).toBe(0);
    });
  });

  describe('close', () => {
    it('should close without error', async () => {
      svc.createQueue('mail');
      svc.createWorker('mail');
      await expect(svc.close()).resolves.not.toThrow();
    });
  });
});
