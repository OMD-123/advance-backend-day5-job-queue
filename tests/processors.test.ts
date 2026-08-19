// tests/processors.test.ts — Job processor unit tests
import { processMail, processAnalytics, processNotification, processExport } from '../src/jobs/processors';
import { Job } from 'bullmq';

function makeMockJob(data: any): Job<any> {
  return {
    data,
    id: `job-${Date.now()}`,
    name: 'test-job',
    progress: 0,
    updateProgress: jest.fn().mockResolvedValue(undefined),
    log: jest.fn().mockResolvedValue(undefined),
  } as unknown as Job<any>;
}

describe('processMail', () => {
  it('should process valid mail job and return success', async () => {
    const job = makeMockJob({ to: 'user@example.com', subject: 'Hello', body: 'Hi there!' });
    const result = await processMail(job);
    expect(result.success).toBe(true);
    expect(result.output).toMatchObject({ to: 'user@example.com', subject: 'Hello' });
    expect(result.processedAt).toBeTruthy();
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should use default from if not provided', async () => {
    const job = makeMockJob({ to: 'a@b.com', subject: 'Hi', body: 'Hello' });
    const result = await processMail(job);
    expect(result.success).toBe(true);
  });

  it('should throw if to is missing', async () => {
    const job = makeMockJob({ to: '', subject: 'Hi', body: 'Hello' });
    await expect(processMail(job)).rejects.toThrow('Missing required fields: to, subject, body');
  });

  it('should throw if subject is missing', async () => {
    const job = makeMockJob({ to: 'a@b.com', subject: '', body: 'Hello' });
    await expect(processMail(job)).rejects.toThrow('Missing required fields: to, subject, body');
  });

  it('should call updateProgress', async () => {
    const job = makeMockJob({ to: 'a@b.com', subject: 'Hi', body: 'Hello' });
    await processMail(job);
    expect(job.updateProgress).toHaveBeenCalled();
  });
});

describe('processAnalytics', () => {
  it('should process valid analytics event', async () => {
    const job = makeMockJob({ event: 'purchase', userId: 'user-42', metadata: { amount: 99 } });
    const result = await processAnalytics(job);
    expect(result.success).toBe(true);
    expect(result.output).toMatchObject({ event: 'purchase', userId: 'user-42', recorded: true });
  });

  it('should handle missing userId (anonymous)', async () => {
    const job = makeMockJob({ event: 'page_view' });
    const result = await processAnalytics(job);
    expect(result.success).toBe(true);
    expect(result.output).toMatchObject({ event: 'page_view', recorded: true });
  });

  it('should throw if event is missing', async () => {
    const job = makeMockJob({ event: '' });
    await expect(processAnalytics(job)).rejects.toThrow('Missing required field: event');
  });

  it('should log the event', async () => {
    const job = makeMockJob({ event: 'signup', userId: 'u1' });
    await processAnalytics(job);
    expect(job.log).toHaveBeenCalled();
  });
});

describe('processNotification', () => {
  it('should process valid notification', async () => {
    const job = makeMockJob({ userId: 'u1', title: 'Hi', body: 'There!', channel: 'push' as const });
    const result = await processNotification(job);
    expect(result.success).toBe(true);
    expect(result.output).toMatchObject({ userId: 'u1', channel: 'push', delivered: true });
  });

  it('should throw if any required field is missing', async () => {
    const job = makeMockJob({ userId: '', title: 'Hi', body: 'There!', channel: 'email' });
    await expect(processNotification(job)).rejects.toThrow('Missing required fields: userId, title, body, channel');
  });
});

describe('processExport', () => {
  it('should process csv export', async () => {
    const job = makeMockJob({ userId: 'u1', format: 'csv' as const, filters: { from: '2026-01-01' } });
    const result = await processExport(job);
    expect(result.success).toBe(true);
    expect(result.output).toMatchObject({ userId: 'u1', format: 'csv' });
    expect((result.output as any).fileUrl).toContain('.csv');
  });

  it('should process json export', async () => {
    const job = makeMockJob({ userId: 'u2', format: 'json' as const });
    const result = await processExport(job);
    expect(result.success).toBe(true);
    expect((result.output as any).fileUrl).toContain('.json');
  });

  it('should throw for unsupported format', async () => {
    const job = makeMockJob({ userId: 'u1', format: 'xls' });
    await expect(processExport(job)).rejects.toThrow('Unsupported export format: xls');
  });

  it('should throw if userId is missing', async () => {
    const job = makeMockJob({ userId: '', format: 'csv' });
    await expect(processExport(job)).rejects.toThrow('Missing required fields: userId, format');
  });

  it('should update progress during export', async () => {
    const job = makeMockJob({ userId: 'u1', format: 'pdf' as const });
    await processExport(job);
    expect(job.updateProgress).toHaveBeenCalledWith(100);
  });
});
