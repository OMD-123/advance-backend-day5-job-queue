// src/config/index.ts — Environment config with defaults
interface QueueConfig {
  name: string;
  defaultOptions: {
    attempts: number;
    backoff: { type: 'exponential' | 'fixed'; delay: number };
    priority: number;
    removeOnComplete: boolean;
    removeOnFail: boolean;
  };
}

interface Config {
  port: number;
  nodeEnv: string;
  redis: {
    host: string;
    port: number;
    password: string;
    concurrency: number;
  };
  jwt: { secret: string };
  queues: QueueConfig[];
}

const config: Config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? '',
    concurrency: parseInt(process.env.REDIS_CONCURRENCY ?? '5', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev_jwt_secret_change_in_production',
  },
  queues: [
    {
      name: process.env.QUEUE_MAIL ?? 'mail',
      defaultOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        priority: 1000,
        removeOnComplete: true,
        removeOnFail: false,
      },
    },
    {
      name: process.env.QUEUE_ANALYTICS ?? 'analytics',
      defaultOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 2000 },
        priority: 500,
        removeOnComplete: true,
        removeOnFail: false,
      },
    },
    {
      name: process.env.QUEUE_NOTIFICATIONS ?? 'notifications',
      defaultOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 500 },
        priority: 2000,
        removeOnComplete: true,
        removeOnFail: false,
      },
    },
    {
      name: process.env.QUEUE_EXPORT ?? 'export',
      defaultOptions: {
        attempts: 1,
        backoff: { type: 'fixed', delay: 5000 },
        priority: 100,
        removeOnComplete: false,
        removeOnFail: true,
      },
    },
  ],
};

export { config, Config, QueueConfig };
