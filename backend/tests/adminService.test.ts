import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/models/User.js', () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
    aggregate: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../src/models/Task.js', () => ({
  default: {
    find: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
  },
}));

vi.mock('../src/models/ActivityLog.js', () => ({
  default: {
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../src/models/Agent.js', () => ({
  default: { aggregate: vi.fn() },
}));

vi.mock('../src/utils/activityLogger.js', () => ({ logActivity: vi.fn() }));
vi.mock('../src/utils/realtime.js', () => ({ emitEvent: vi.fn() }));

import User from '../src/models/User.js';
import Task from '../src/models/Task.js';
import ActivityLog from '../src/models/ActivityLog.js';
import {
  getUsers, toggleUserStatus, getAdminTasks, getActivityLogs,
  getMetrics, getAnalytics, getPublicAnalytics,
} from '../src/services/adminService.js';

describe('adminService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getUsers', () => {
    it('sorts by role then name', async () => {
      const sort = vi.fn().mockResolvedValue([{ name: 'A' }]);
      vi.mocked(User.find).mockReturnValue({ sort } as any);
      expect(await getUsers()).toHaveLength(1);
      expect(sort).toHaveBeenCalledWith({ role: 1, name: 1 });
    });

    it('empty array when no users', async () => {
      vi.mocked(User.find).mockReturnValue({ sort: vi.fn().mockResolvedValue([]) } as any);
      expect(await getUsers()).toEqual([]);
    });
  });

  describe('toggleUserStatus', () => {
    it('throws when toggling self', async () => {
      await expect(toggleUserStatus('same', 'same')).rejects.toThrow('own account');
    });

    it('throws when user not found', async () => {
      vi.mocked(User.findById).mockResolvedValue(null);
      await expect(toggleUserStatus('other', 'me')).rejects.toThrow('not found');
    });

    it('toggles active→inactive', async () => {
      const save = vi.fn();
      vi.mocked(User.findById).mockResolvedValue({ _id: 'o', status: 'active', save } as any);
      await toggleUserStatus('o', 'me');
      expect(save).toHaveBeenCalled();
    });
  });

  describe('getAdminTasks', () => {
    it('paginates tasks with populate chain', async () => {
      const chain: any = {
        populate: vi.fn(),
        sort: vi.fn(),
        skip: vi.fn(),
        limit: vi.fn(),
      };
      chain.populate.mockReturnValue(chain);
      chain.sort.mockReturnValue(chain);
      chain.skip.mockReturnValue(chain);
      chain.limit.mockResolvedValue([{ title: 'T1' }]);
      vi.mocked(Task.find).mockReturnValue(chain);
      vi.mocked(Task.countDocuments).mockResolvedValue(10);
      const r = await getAdminTasks({ page: '1', limit: '25' });
      expect(r.total).toBe(10);
      expect(r.items).toHaveLength(1);
    });
  });

  describe('getActivityLogs', () => {
    it('paginates logs with populate', async () => {
      const chain: any = {
        populate: vi.fn(),
        sort: vi.fn(),
        skip: vi.fn(),
        limit: vi.fn(),
      };
      chain.populate.mockReturnValue(chain);
      chain.sort.mockReturnValue(chain);
      chain.skip.mockReturnValue(chain);
      chain.limit.mockResolvedValue([{ action: 'X' }]);
      vi.mocked(ActivityLog.find).mockReturnValue(chain);
      vi.mocked(ActivityLog.countDocuments).mockResolvedValue(50);
      const r = await getActivityLogs({ page: '1', limit: '50' });
      expect(r.total).toBe(50);
      expect(r.items).toHaveLength(1);
    });
  });

  describe('getMetrics', () => {
    it('aggregates via $facet', async () => {
      vi.mocked(Task.aggregate).mockResolvedValue([{ taskCounts: [{ _id: 'pending', count: 5 }, { _id: 'in_progress', count: 3 }, { _id: 'completed', count: 2 }] }]);
      vi.mocked(User.aggregate).mockResolvedValue([{ total: 10, active: 8, inactive: 2 }]);
      vi.mocked((await import('../src/models/Agent.js')).default.aggregate).mockResolvedValue([{ total: 3, active: 2, inactive: 1 }]);
      const r = await getMetrics();
      expect(r.counts.tasks.pending).toBe(5);
      expect(r.counts.tasks.in_progress).toBe(3);
      expect(r.counts.tasks.completed).toBe(2);
      expect(r.counts.users.total).toBe(10);
      expect(r.counts.agents.total).toBe(3);
    });

    it('zero counts', async () => {
      vi.mocked(Task.aggregate).mockResolvedValue([{}]);
      vi.mocked(User.aggregate).mockResolvedValue([]);
      vi.mocked((await import('../src/models/Agent.js')).default.aggregate).mockResolvedValue([]);
      const r = await getMetrics();
      expect(r.counts.tasks.pending).toBe(0);
      expect(r.counts.tasks.in_progress).toBe(0);
    });
  });

  describe('getAnalytics', () => {
    it('returns analytics with user stats', async () => {
      vi.mocked(Task.aggregate)
        .mockResolvedValueOnce([{ total: 100, completed: 30, pending: 50, inProgress: 20 }])
        .mockResolvedValueOnce([{ _id: 'u1', name: 'A', email: 'a@b', role: 'user', status: 'active', totalTasks: 5, completedTasks: 3 }]);
      vi.mocked(User.aggregate).mockResolvedValue([{ total: 10, active: 9, inactive: 1 }]);
      const r = await getAnalytics();
      expect(r.userTaskStats).toHaveLength(1);
      expect(r.tasks.total).toBe(100);
      expect(r.tasks.completed).toBe(30);
      expect(r.users.total).toBe(10);
    });
  });

  describe('getPublicAnalytics', () => {
    it('returns public analytics', async () => {
      vi.mocked(Task.countDocuments)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(28)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(12);
      const r = await getPublicAnalytics();
      expect(r.tasks.total).toBe(50);
      expect(r.tasks.completed).toBe(12);
      expect(r.tasks.pending).toBe(28);
    });
  });
});
