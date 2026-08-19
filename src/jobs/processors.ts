// src/jobs/processors.ts — Job processors for each queue type
import { Job } from 'bullmq';
import { MailJobData, AnalyticsJobData, NotificationJobData, ExportJobData, JobResult } from '../models/job';

// Simulated processor — no actual email/SMS sending in dev
async function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export async function processMail(job: Job<any>): Promise<JobResult> {
  const start = Date.now();
  await job.updateProgress(10);
  const { to, subject, body, from = 'noreply@example.com' } = job.data;

  if (!to || !subject || !body) {
    throw new Error('Missing required fields: to, subject, body');
  }

  // Simulate email sending
  await sleep(50);
  await job.updateProgress(100);

  return {
    success: true,
    output: { messageId: `msg_${Date.now()}`, to, subject },
    processedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
  };
}

export async function processAnalytics(job: Job<any>): Promise<JobResult> {
  const start = Date.now();
  const { event, userId, metadata } = job.data;

  if (!event) {
    throw new Error('Missing required field: event');
  }

  // Simulate analytics aggregation
  await sleep(20);
  await job.log(`Event captured: ${event} from user ${userId ?? 'anonymous'}`);

  return {
    success: true,
    output: { event, userId, recorded: true },
    processedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
  };
}

export async function processNotification(job: Job<any>): Promise<JobResult> {
  const start = Date.now();
  const { userId, title, body, channel } = job.data;

  if (!userId || !title || !body || !channel) {
    throw new Error('Missing required fields: userId, title, body, channel');
  }

  await sleep(30);

  return {
    success: true,
    output: { userId, channel, delivered: true },
    processedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
  };
}

export async function processExport(job: Job<any>): Promise<JobResult> {
  const start = Date.now();
  const { userId, format, filters } = job.data;

  if (!userId || !format) {
    throw new Error('Missing required fields: userId, format');
  }

  if (!['csv', 'json', 'pdf'].includes(format)) {
    throw new Error(`Unsupported export format: ${format}`);
  }

  await job.updateProgress(50);
  await sleep(100);
  await job.updateProgress(100);

  return {
    success: true,
    output: { userId, format, filters, fileUrl: `https://exports.example.com/${userId}_export.${format}` },
    processedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
  };
}
