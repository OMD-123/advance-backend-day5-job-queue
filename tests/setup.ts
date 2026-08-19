// tests/setup.ts — Jest setup (no Redis needed)
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.REDIS_HOST = 'localhost';
  process.env.REDIS_PORT = '6379';
  process.env.JWT_SECRET = 'test_secret';
  process.env.QUEUE_MAIL = 'mail';
  process.env.QUEUE_ANALYTICS = 'analytics';
  process.env.QUEUE_NOTIFICATIONS = 'notifications';
  process.env.QUEUE_EXPORT = 'export';
});

afterAll(() => {
  jest.clearAllMocks();
});
