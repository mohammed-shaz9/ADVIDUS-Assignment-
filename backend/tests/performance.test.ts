import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/models/PerformanceMetric.js', () => ({
  default: { insertMany: vi.fn(), aggregate: vi.fn(), findOne: vi.fn(), create: vi.fn() },
}));
vi.mock('../src/models/Task.js', () => ({ default: { countDocuments: vi.fn(), aggregate: vi.fn() } }));
vi.mock('../src/models/User.js', () => ({ default: { findById: vi.fn(), find: vi.fn() } }));

import PerformanceMetric from '../src/models/PerformanceMetric.js';
import Task from '../src/models/Task.js';
import { toMetric, calculateUserScore, snapshotAllPerformance } from '../src/services/performanceService.js';

describe('toMetric', () => {
  beforeEach(() => vi.clearAllMocks());

  it('0 tasks -> all zeros, fresh object each call', () => {
    const m = toMetric(0, 0);
    expect(m).toEqual({ score: 0, tasksCompleted: 0, tasksAssigned: 0, onTimeCompletion: 0, overdueTasks: 0, avgCompletionHours: 0 });
    m.score = 99;
    expect(toMetric(0, 0).score).toBe(0);
  });

  it('all done -> 100, nothing overdue', () => {
    expect(toMetric(10, 10)).toEqual({
      score: 100, tasksCompleted: 10, tasksAssigned: 10, onTimeCompletion: 10, overdueTasks: 0, avgCompletionHours: 0,
    });
  });

  it('none done -> 0 but overdue = total', () => {
    expect(toMetric(5, 0)).toMatchObject({ score: 0, tasksAssigned: 5, tasksCompleted: 0, overdueTasks: 5 });
  });

  it.each([
    [3, 1, 33],
    [3, 2, 67],
    [8, 1, 13], // 12.5 rounds up
    [200, 1, 1], // 0.5 rounds up
  ])('partial %i total / %i done -> score %i', (total, done, score) => {
    expect(toMetric(total, done).score).toBe(score);
  });

  it('overdue = total - done', () => {
    const m = toMetric(7, 3);
    expect(m.overdueTasks).toBe(4);
    expect(m.tasksCompleted).toBe(3);
    expect(m.tasksAssigned).toBe(7);
    expect(m.onTimeCompletion).toBe(3);
  });

  it('calculateUserScore feeds counts into toMetric', async () => {
    vi.mocked(Task.countDocuments).mockResolvedValueOnce(4 as never).mockResolvedValueOnce(1 as never);
    expect(await calculateUserScore('u1')).toEqual(toMetric(4, 1));
    expect(Task.countDocuments).toHaveBeenNthCalledWith(1, { owner: 'u1' });
    expect(Task.countDocuments).toHaveBeenNthCalledWith(2, { owner: 'u1', status: 'completed' });
  });

  it('snapshotAllPerformance bulk-inserts in chunks of 5000, unordered', async () => {
    const rows = Array.from({ length: 6000 }, (_, i) => ({ _id: `u${i}`, total: 2, done: 1 }));
    vi.mocked(Task.aggregate).mockResolvedValue(rows);
    vi.mocked(PerformanceMetric.insertMany).mockResolvedValue([] as never);
    const r = await snapshotAllPerformance();
    expect(r.users).toBe(6000);
    expect(PerformanceMetric.insertMany).toHaveBeenCalledTimes(2);
    const [first, opts] = vi.mocked(PerformanceMetric.insertMany).mock.calls[0] as any[];
    expect(first).toHaveLength(5000);
    expect(opts).toEqual({ ordered: false });
    expect(first[0]).toMatchObject({ user: 'u0', score: 50, period: 'daily' });
    expect((vi.mocked(PerformanceMetric.insertMany).mock.calls[1][0] as any[])).toHaveLength(1000);
  });

  it('snapshotAllPerformance with no tasks inserts nothing', async () => {
    vi.mocked(Task.aggregate).mockResolvedValue([]);
    const r = await snapshotAllPerformance();
    expect(r.users).toBe(0);
    expect(PerformanceMetric.insertMany).not.toHaveBeenCalled();
  });
});
