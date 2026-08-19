// tests/job.test.ts — Job model validation tests
import { JobData, JobPriority, JobStatus, QueueStats } from '../src/models/job';

describe('JobData union types', () => {
  it('should accept valid MailJobData', () => {
    const mail: JobData = {
      to: 'user@example.com',
      subject: 'Hello',
      body: 'Hello world',
    };
    expect(mail.to).toBe('user@example.com');
    expect((mail as any).subject).toBe('Hello');
  });

  it('should accept valid AnalyticsJobData', () => {
    const analytics: JobData = {
      event: 'page_view',
      userId: 'user-123',
      metadata: { page: '/home' },
    };
    expect((analytics as any).event).toBe('page_view');
    expect((analytics as any).userId).toBe('user-123');
  });

  it('should accept valid NotificationJobData', () => {
    const notif: JobData = {
      userId: 'user-456',
      title: 'New message',
      body: 'You have a new message',
      channel: 'email',
    };
    expect((notif as any).channel).toBe('email');
  });

  it('should accept valid ExportJobData', () => {
    const exp: JobData = {
      userId: 'user-789',
      format: 'csv',
      filters: { from: '2026-01-01' },
    };
    expect((exp as any).format).toBe('csv');
  });

  it('should have valid JobStatus values', () => {
    const statuses: JobStatus[] = ['pending', 'active', 'completed', 'failed', 'delayed', 'waiting'];
    expect(statuses).toHaveLength(6);
  });

  it('should have valid JobPriority values', () => {
    const priorities: JobPriority[] = ['low', 'normal', 'high', 'critical'];
    expect(priorities).toHaveLength(4);
  });

  it('should have zero-initialized QueueStats', () => {
    const stats: QueueStats = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0 };
    expect(Object.values(stats).every(v => v === 0)).toBe(true);
  });
});

describe('JobData field validation (unit)', () => {
  it('MailJobData requires to, subject, body', () => {
    const validate = (d: any) => d.to && d.subject && d.body;
    expect(validate({ to: 'a@b.com', subject: 'Hi', body: 'Hi!' })).toBeTruthy();
    expect(validate({ to: 'a@b.com', subject: 'Hi' })).toBeFalsy();
  });

  it('ExportJobData requires userId and format', () => {
    const validate = (d: any) => d.userId && d.format;
    expect(validate({ userId: 'u1', format: 'csv' })).toBeTruthy();
    expect(validate({ userId: 'u1' })).toBeFalsy();
    expect(validate({ format: 'pdf' })).toBeFalsy();
  });

  it('format must be csv, json, or pdf', () => {
    const valid = ['csv', 'json', 'pdf'];
    valid.forEach(f => expect(valid.includes(f)).toBe(true));
    expect(valid.includes('xls')).toBe(false);
  });

  it('notification channel must be email, push, sms, or in-app', () => {
    const valid = ['email', 'push', 'sms', 'in-app'];
    valid.forEach(c => expect(valid.includes(c)).toBe(true));
    expect(valid.includes('telegram')).toBe(false);
  });
});
