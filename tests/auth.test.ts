// tests/auth.test.ts — JWT auth middleware tests
import { authMiddleware, requireRole } from '../src/middleware/auth';
import { Request, Response, NextFunction } from 'express';

describe('authMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {};
    mockNext = jest.fn();
  });

  it('should reject missing Authorization header', () => {
    authMiddleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    expect((mockNext as jest.Mock).mock.calls[0][0].message).toBe('Missing or invalid Authorization header');
  });

  it('should reject non-Bearer token', () => {
    mockReq.headers = { authorization: 'Basic abc123' };
    authMiddleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should reject malformed JWT (not 3 parts)', () => {
    mockReq.headers = { authorization: 'Bearer notajwt' };
    authMiddleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should accept valid JWT and extract userId from sub', () => {
    // Payload: { sub: "user-123", role: "admin" }
    const payload = Buffer.from(JSON.stringify({ sub: 'user-123', role: 'admin' })).toString('base64');
    const token = `header.${payload}.signature`;
    mockReq.headers = { authorization: `Bearer ${token}` };

    authMiddleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockReq.userId).toBe('user-123');
    expect(mockReq.userRole).toBe('admin');
  });

  it('should fall back to userId field if sub is missing', () => {
    const payload = Buffer.from(JSON.stringify({ userId: 'uid-456', role: 'user' })).toString('base64');
    const token = `header.${payload}.signature`;
    mockReq.headers = { authorization: `Bearer ${token}` };

    authMiddleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

    expect(mockReq.userId).toBe('uid-456');
  });

  it('should default to dev-user if no sub or userId', () => {
    const payload = Buffer.from(JSON.stringify({ role: 'guest' })).toString('base64');
    const token = `header.${payload}.signature`;
    mockReq.headers = { authorization: `Bearer ${token}` };

    authMiddleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);

    expect(mockReq.userId).toBe('dev-user');
  });
});

describe('requireRole', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = { userRole: 'user' };
    mockRes = {};
    mockNext = jest.fn();
  });

  it('should pass if userRole matches required role', () => {
    const middleware = requireRole('admin');
    mockReq.userRole = 'admin';
    middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should allow admin to bypass any role check', () => {
    const middleware = requireRole('superadmin');
    mockReq.userRole = 'admin';
    middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should reject if role does not match', () => {
    const middleware = requireRole('admin');
    mockReq.userRole = 'user';
    middleware(mockReq as Request, mockRes as Response, mockNext as NextFunction);
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    expect((mockNext as jest.Mock).mock.calls[0][0].message).toContain('Forbidden');
  });
});
