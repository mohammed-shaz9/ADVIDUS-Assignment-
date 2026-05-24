import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/models/User.js', () => ({
  default: {
    find: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
  },
}));

import User from '../src/models/User.js';
import { getDemoCredentials, ensureDemoUsers } from '../src/services/authService.js';

describe('authService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getDemoCredentials', () => {
    it('returns 5 active employees with credentials', async () => {
      const mockUsers = [
        { name: 'Alice', email: 'alice@test.com', role: 'user', department: 'd1' },
        { name: 'Bob', email: 'bob@test.com', role: 'user', department: 'd2' },
        { name: 'Charlie', email: 'charlie@test.com', role: 'user', department: 'd1' },
        { name: 'Diana', email: 'diana@test.com', role: 'user', department: 'd3' },
        { name: 'Eve', email: 'eve@test.com', role: 'user', department: 'd2' },
      ];
      const lean = vi.fn().mockResolvedValue(mockUsers);
      const select = vi.fn().mockReturnValue({ lean });
      const limit = vi.fn().mockReturnValue({ select });
      vi.mocked(User.find).mockReturnValue({ limit } as any);

      const result = await getDemoCredentials();
      expect(User.find).toHaveBeenCalledWith({ role: 'user', status: 'active' });
      expect(result).toHaveLength(5);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('email');
      expect(result[0]).toHaveProperty('role', 'Employee');
      expect(result[0]).toHaveProperty('password', 'User@123');
      expect(result[0]).toHaveProperty('department');
    });

    it('empty array when no employees', async () => {
      vi.mocked(User.find).mockReturnValue({ limit: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }) } as any);
      expect(await getDemoCredentials()).toEqual([]);
    });
  });

  describe('ensureDemoUsers', () => {
    it('returns created/total', async () => {
      const select = vi.fn().mockResolvedValue([{ _id: 'existing' }]);
      const limit = vi.fn().mockReturnValue({ select });
      vi.mocked(User.find).mockReturnValue({ limit } as any);
      const result = await ensureDemoUsers();
      expect(result).toHaveProperty('created');
      expect(result).toHaveProperty('total');
    });
  });
});
