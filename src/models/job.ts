// src/models/job.ts — Job payload types
export type JobStatus = 'pending' | 'active' | 'completed' | 'failed' | 'delayed' | 'waiting';

export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

export interface MailJobData {
  to: string;
  subject: string;
  body: string;
  from?: string;
  cc?: string[];
  attachments?: string[];
}

export interface AnalyticsJobData {
  event: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface NotificationJobData {
  userId: string;
  title: string;
  body: string;
  channel: 'email' | 'push' | 'sms' | 'in-app';
  metadata?: Record<string, unknown>;
}

export interface ExportJobData {
  userId: string;
  format: 'csv' | 'json' | 'pdf';
  filters?: Record<string, unknown>;
}

export type JobData = MailJobData | AnalyticsJobData | NotificationJobData | ExportJobData;

export interface JobResult {
  success: boolean;
  output?: unknown;
  error?: string;
  processedAt: string;
  durationMs?: number;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}
