import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/models/User.js', () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndDelete: vi.fn(),
    aggregate: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../src/models/Task.js', () => ({
  default: {
    find: vi.fn(),
    countDocuments: vi.fn(),
    aggregate: vi.fn(),
    deleteMany: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock('../src/models/ActivityLog.js', () => ({
  default: { find: vi.fn(), countDocuments: vi.fn() },
}));

vi.mock('../src/models/Agent.js', () => ({ default: { aggregate: vi.fn() } }));
vi.mock('../src/models/Notification.js', () => ({ default: { deleteMany: vi.fn() } }));

vi.mock('../src/utils/activityLogger.js', () => ({ logActivity: vi.fn() }));
vi.mock('../src/utils/realtime.js', () => ({ emitEvent: vi.fn() }));
vi.mock('../src/utils/userCache.js', () => ({ invalidateUser: vi.fn() }));
// pass-through memo: no caching between tests
vi.mock('../src/utils/memo.js', () => ({ memo: (_ttl: number, fn: unknown) => fn }));

import User from '../src/models/User.js';
import Task from '../src/models/Task.js';
import ActivityLog from '../src/models/ActivityLog.js';
import Agent from '../src/models/Agent.js';
import Notification from '../src/models/Notification.js';
import { logActivity } from '../src/utils/activityLogger.js';
import { invalidateUser } from '../src/utils/userCache.js';
import {
  getUsers, toggleUserStatus, deleteUser, getAdminTasks, getActivityLogs,
  getMetrics, getAnalytics, getPublicAnalytics,
} from '../src/services/adminService.js';

// Chainable query mock: every builder method returns the chain, .lean() resolves `result`.
const chain = (result: unknown) => {
  const c: any = {};
  for (const m of ['populate', 'sort', 'skip', 'limit']) c[m] = vi.fn(() => c);
  c.lean = vi.fn().mockResolvedValue(result);
  return c;
};

const group = (rows: Array<[string, number]>) => rows.map(([_id, count]) => ({ _id, count }));

describe('adminService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getUsers', () => {
    const setup = (items: unknown[] = [{ name: 'A' }], total = 1) => {
      const c = chain(items);
      vi.mocked(User.find).mockReturnValue(c);
      vi.mocked(User.countDocuments).mockResolvedValue(total as never);
      return c;
    };

    it('admin: paginated shape, -password projection, role/name sort, lean', async () => {
      const c = setup([{ name: 'A' }], 120);
      const r = await getUsers({});
      expect(User.find).toHaveBeenCalledWith({}, '-password');
      expect(c.sort).toHaveBeenCalledWith({ role: 1, name: 1 });
      expect(c.skip).toHaveBeenCalledWith(0);
      expect(c.limit).toHaveBeenCalledWith(50);
      expect(c.lean).toHaveBeenCalled();
      expect(r).toMatchObject({ items: [{ name: 'A' }], page: 1, limit: 50, total: 120, totalPages: 3 });
      expect(typeof r.serverTime).toBe('string');
    });

    it('empty result -> totalPages 1', async () => {
      setup([], 0);
      const r = await getUsers({});
      expect(r.items).toEqual([]);
      expect(r.total).toBe(0);
      expect(r.totalPages).toBe(1);
    });

    it('non-admin: name/designation projection, active-only filter, name sort', async () => {
      const c = setup();
      await getUsers({}, 'user');
      expect(User.find).toHaveBeenCalledWith({ status: 'active' }, 'name designation');
      expect(c.sort).toHaveBeenCalledWith({ name: 1 });
      expect(User.countDocuments).toHaveBeenCalledWith({ status: 'active' });
    });

    it('non-admin q searches name only, never email', async () => {
      setup();
      await getUsers({ q: 'ali' }, 'user');
      const filter: any = vi.mocked(User.find).mock.calls[0][0];
      expect(filter.status).toBe('active');
      expect(filter.$or).toHaveLength(1);
      expect(Object.keys(filter.$or[0])).toEqual(['name']);
      expect(JSON.stringify(filter)).not.toContain('email');
    });

    it('admin q searches name and lowercased email prefix', async () => {
      setup();
      await getUsers({ q: 'ALI' });
      const filter: any = vi.mocked(User.find).mock.calls[0][0];
      expect(filter.$or).toHaveLength(2);
      expect(filter.$or[0].name.flags).toBe('i');
      expect(filter.$or[1].email.source).toBe('^ali');
    });

    it('q is regex-escaped', async () => {
      setup();
      await getUsers({ q: 'a.b*' });
      const filter: any = vi.mocked(User.find).mock.calls[0][0];
      const name: RegExp = filter.$or[0].name;
      expect(name.source).toBe('^a\\.b\\*');
      expect(name.test('a.b*x')).toBe(true);
      expect(name.test('axbbb')).toBe(false); // unescaped '.' and '*' would match this
      expect((filter.$or[1].email as RegExp).source).toBe('^a\\.b\\*');
    });

    it('ignores array/object q (query-string injection)', async () => {
      setup();
      await getUsers({ q: { $ne: 'x' } as any });
      expect(User.find).toHaveBeenCalledWith({}, '-password');
      await getUsers({ q: ['a'] as any });
      expect(vi.mocked(User.find).mock.calls[1][0]).toEqual({});
    });

    it('valid role/status filters applied for admin', async () => {
      setup();
      await getUsers({ role: 'admin', status: 'inactive' });
      expect(User.find).toHaveBeenCalledWith({ role: 'admin', status: 'inactive' }, '-password');
    });

    it('invalid role/status filters ignored', async () => {
      setup();
      await getUsers({ role: 'superadmin', status: 'banned' });
      expect(User.find).toHaveBeenCalledWith({}, '-password');
    });

    it('non-admin cannot override role/status filters', async () => {
      setup();
      await getUsers({ role: 'admin', status: 'inactive' }, 'user');
      expect(User.find).toHaveBeenCalledWith({ status: 'active' }, 'name designation');
    });

    it('limit clamped to 100', async () => {
      const c = setup();
      const r = await getUsers({ limit: '100000' });
      expect(c.limit).toHaveBeenCalledWith(100);
      expect(r.limit).toBe(100);
    });

    it('page/limit translate to skip', async () => {
      const c = setup();
      await getUsers({ page: '3', limit: '10' });
      expect(c.skip).toHaveBeenCalledWith(20);
      expect(c.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('toggleUserStatus', () => {
    const user = (status: string) => ({
      _id: 'o', name: 'N', email: 'n@x.io', status, save: vi.fn().mockResolvedValue(undefined),
    });

    it('throws when toggling self, touches nothing', async () => {
      await expect(toggleUserStatus('same', 'same')).rejects.toThrow('own account');
      expect(User.findById).not.toHaveBeenCalled();
      expect(invalidateUser).not.toHaveBeenCalled();
    });

    it('throws when user not found', async () => {
      vi.mocked(User.findById).mockResolvedValue(null);
      await expect(toggleUserStatus('other', 'me')).rejects.toThrow('not found');
      expect(invalidateUser).not.toHaveBeenCalled();
    });

    it('toggles active -> inactive, saves, invalidates auth cache, logs', async () => {
      const u = user('active');
      vi.mocked(User.findById).mockResolvedValue(u as any);
      await toggleUserStatus('o', 'me');
      expect(u.status).toBe('inactive');
      expect(u.save).toHaveBeenCalled();
      expect(invalidateUser).toHaveBeenCalledWith('o');
      expect(logActivity).toHaveBeenCalledWith('me', 'USER_STATUS_UPDATED', expect.stringContaining('inactive'));
    });

    it('toggles inactive -> active', async () => {
      const u = user('inactive');
      vi.mocked(User.findById).mockResolvedValue(u as any);
      await toggleUserStatus('o', 'me');
      expect(u.status).toBe('active');
      expect(invalidateUser).toHaveBeenCalledWith('o');
    });
  });

  describe('deleteUser', () => {
    it('throws when deleting self, touches nothing', async () => {
      await expect(deleteUser('same', 'same')).rejects.toThrow('own account');
      expect(User.findById).not.toHaveBeenCalled();
      expect(Task.deleteMany).not.toHaveBeenCalled();
    });

    it('throws when user not found, deletes nothing', async () => {
      vi.mocked(User.findById).mockResolvedValue(null);
      await expect(deleteUser('t', 'me')).rejects.toThrow('not found');
      expect(Task.deleteMany).not.toHaveBeenCalled();
      expect(User.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('deletes owned tasks, unsets assignee on others, deletes notifications, user, cache', async () => {
      const target = { _id: 'oid', name: 'N', email: 'n@x.io' };
      vi.mocked(User.findById).mockResolvedValue(target as any);
      vi.mocked(Task.deleteMany).mockResolvedValue({ deletedCount: 3 } as any);
      vi.mocked(Task.updateMany).mockResolvedValue({} as any);
      vi.mocked(Notification.deleteMany).mockResolvedValue({} as any);
      vi.mocked(User.findByIdAndDelete).mockResolvedValue(target as any);

      const r = await deleteUser('t', 'me');

      expect(Task.deleteMany).toHaveBeenCalledWith({ owner: 'oid' });
      expect(Task.updateMany).toHaveBeenCalledWith({ 'assignedTo.user': 'oid' }, { $unset: { 'assignedTo.user': 1 } });
      expect(Notification.deleteMany).toHaveBeenCalledWith({ userId: 'oid' });
      expect(User.findByIdAndDelete).toHaveBeenCalledWith('t');
      expect(invalidateUser).toHaveBeenCalledWith('t');
      expect(logActivity).toHaveBeenCalledWith('me', 'USER_DELETED', expect.stringContaining('3 tasks'));
      expect(r.message).toContain('3 tasks');
    });
  });

  describe('getAdminTasks', () => {
    const setup = (items: unknown[] = [{ title: 'T1' }], total = 10) => {
      const c = chain(items);
      vi.mocked(Task.find).mockReturnValue(c);
      vi.mocked(Task.countDocuments).mockResolvedValue(total as never);
      return c;
    };

    it('lean paginated chain with populates and createdAt sort', async () => {
      const c = setup();
      const r = await getAdminTasks({ page: '2', limit: '5' });
      expect(c.populate).toHaveBeenCalledTimes(3);
      expect(c.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(c.skip).toHaveBeenCalledWith(5);
      expect(c.limit).toHaveBeenCalledWith(5);
      expect(c.lean).toHaveBeenCalled();
      expect(r).toMatchObject({ page: 2, limit: 5, total: 10, totalPages: 2 });
      expect(r.items).toHaveLength(1);
    });

    it('no filter by default; no $text without q', async () => {
      setup();
      await getAdminTasks({});
      expect(Task.find).toHaveBeenCalledWith({});
      expect(Task.countDocuments).toHaveBeenCalledWith({});
    });

    it('valid status applied, invalid status ignored', async () => {
      setup();
      await getAdminTasks({ status: 'completed' });
      expect(Task.find).toHaveBeenLastCalledWith({ status: 'completed' });
      await getAdminTasks({ status: 'bogus' });
      expect(Task.find).toHaveBeenLastCalledWith({});
    });

    it('$text search only when q present', async () => {
      setup();
      await getAdminTasks({ q: '  deploy  ' });
      expect(Task.find).toHaveBeenLastCalledWith({ $text: { $search: 'deploy' } });
      await getAdminTasks({ q: '   ' });
      expect(Task.find).toHaveBeenLastCalledWith({});
    });

    it('limit capped at 200', async () => {
      const c = setup();
      await getAdminTasks({ limit: '9999' });
      expect(c.limit).toHaveBeenCalledWith(200);
    });
  });

  describe('getActivityLogs', () => {
    const setup = () => {
      const c = chain([{ action: 'X' }]);
      vi.mocked(ActivityLog.find).mockReturnValue(c);
      vi.mocked(ActivityLog.countDocuments).mockResolvedValue(50 as never);
      return c;
    };

    it('paginated shape with populate + lean', async () => {
      const c = setup();
      const r = await getActivityLogs({ page: '1', limit: '50' });
      expect(c.populate).toHaveBeenCalledWith('userId', 'name email role');
      expect(c.lean).toHaveBeenCalled();
      expect(r).toMatchObject({ total: 50, page: 1, limit: 50, totalPages: 1 });
      expect(r.items).toHaveLength(1);
    });

    it('non-admin viewer is scoped to own logs', async () => {
      setup();
      await getActivityLogs({}, { id: 'u1', role: 'user' });
      expect(ActivityLog.find).toHaveBeenCalledWith({ userId: 'u1' });
      expect(ActivityLog.countDocuments).toHaveBeenCalledWith({ userId: 'u1' });
    });

    it('admin viewer sees all logs', async () => {
      setup();
      await getActivityLogs({}, { id: 'a1', role: 'admin' });
      expect(ActivityLog.find).toHaveBeenCalledWith({});
    });

    it('action filter combines with viewer scope', async () => {
      setup();
      await getActivityLogs({ action: 'TASK_CREATED' }, { id: 'u1', role: 'user' });
      expect(ActivityLog.find).toHaveBeenCalledWith({ userId: 'u1', action: 'TASK_CREATED' });
    });
  });

  describe('getMetrics', () => {
    it('grouped aggregates -> counts', async () => {
      vi.mocked(Task.aggregate).mockResolvedValue(group([['pending', 5], ['in_progress', 3], ['completed', 2]]));
      vi.mocked(User.aggregate).mockResolvedValue(group([['active', 8], ['inactive', 2]]));
      vi.mocked(Agent.aggregate).mockResolvedValue(group([['active', 2], ['inactive', 1]]));
      const r = await getMetrics();
      expect(r.counts.tasks).toEqual({ pending: 5, in_progress: 3, completed: 2 });
      expect(r.counts.users).toEqual({ total: 10, active: 8, inactive: 2 });
      expect(r.counts.agents).toEqual({ total: 3, active: 2, inactive: 1 });
      expect(Task.aggregate).toHaveBeenCalledWith([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    });

    it('zero counts; null/missing status groups ignored', async () => {
      vi.mocked(Task.aggregate).mockResolvedValue([{ _id: null, count: 9 }]);
      vi.mocked(User.aggregate).mockResolvedValue([]);
      vi.mocked(Agent.aggregate).mockResolvedValue([]);
      const r = await getMetrics();
      expect(r.counts.tasks).toEqual({ pending: 0, in_progress: 0, completed: 0 });
      expect(r.counts.users).toEqual({ total: 0, active: 0, inactive: 0 });
      expect(r.counts.agents.total).toBe(0);
    });
  });

  describe('getAnalytics', () => {
    const OWNERS = [{ _id: 'u1', name: 'A', email: 'a@b.io', role: 'user', status: 'active', totalTasks: 5, completedTasks: 3 }];

    // First stage tells the two Task.aggregate callers apart: status counts vs top-owner pipeline.
    const setup = (tasks: Array<[string, number]>, users: Array<[string, number]> = [['active', 9], ['inactive', 1]]) => {
      vi.mocked(Task.aggregate).mockImplementation(((p: any[]) =>
        Promise.resolve(p[0].$group._id === '$status' ? group(tasks) : OWNERS)) as any);
      vi.mocked(User.aggregate).mockResolvedValue(group(users));
    };
    const topLimit = () => {
      const pipeline: any[] = vi.mocked(Task.aggregate).mock.calls.map((c) => c[0] as any[]).find((p) => p.some((s) => '$limit' in s))!;
      return pipeline.find((s) => '$limit' in s).$limit;
    };

    it('keeps users / tasks / userTaskStats shape and completionRate', async () => {
      setup([['pending', 50], ['in_progress', 20], ['completed', 30]]);
      const r = await getAnalytics();
      expect(Object.keys(r).sort()).toEqual(['tasks', 'userTaskStats', 'users']);
      expect(r.tasks).toEqual({ total: 100, completed: 30, pending: 50, inProgress: 20, completionRate: 30 });
      expect(r.users).toEqual({ total: 10, active: 9, inactive: 1 });
      expect(r.userTaskStats).toEqual(OWNERS);
    });

    it('completionRate rounds; 0 when no tasks', async () => {
      setup([['pending', 2], ['completed', 1]]);
      expect((await getAnalytics()).tasks.completionRate).toBe(33);
      setup([]);
      expect((await getAnalytics()).tasks.completionRate).toBe(0);
    });

    it.each([
      [undefined, 20],
      ['7', 7],
      ['-5', 1],
      ['500', 100],
      ['abc', 20],
    ])('top=%s -> $limit %i', async (top, expected) => {
      setup([['pending', 1]]);
      await getAnalytics({ top } as any);
      expect(topLimit()).toBe(expected);
    });
  });

  describe('getPublicAnalytics', () => {
    it('returns task totals and completionRate from one grouped scan', async () => {
      vi.mocked(Task.aggregate).mockResolvedValue(group([['pending', 28], ['in_progress', 10], ['completed', 12]]));
      const r = await getPublicAnalytics();
      expect(r.tasks).toEqual({ total: 50, pending: 28, inProgress: 10, completed: 12, completionRate: 24 });
      expect(typeof r.serverTime).toBe('string');
      expect(Task.aggregate).toHaveBeenCalledTimes(1);
      expect(Task.countDocuments).not.toHaveBeenCalled();
    });

    it('zero tasks -> zeros', async () => {
      vi.mocked(Task.aggregate).mockResolvedValue([]);
      const r = await getPublicAnalytics();
      expect(r.tasks).toEqual({ total: 0, pending: 0, inProgress: 0, completed: 0, completionRate: 0 });
    });
  });
});
