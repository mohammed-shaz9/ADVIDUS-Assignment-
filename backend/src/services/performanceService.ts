import PerformanceMetric from '../models/PerformanceMetric.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

const EMPTY = { score: 0, tasksCompleted: 0, tasksAssigned: 0, onTimeCompletion: 0, overdueTasks: 0, avgCompletionHours: 0 };

// Pure: score = completion rate in %. ponytail: "on time" == completed until tasks carry due dates.
export const toMetric = (total: number, completed: number) =>
  total === 0
    ? { ...EMPTY }
    : {
        score: Math.round((completed / total) * 100),
        tasksCompleted: completed,
        tasksAssigned: total,
        onTimeCompletion: completed,
        overdueTasks: total - completed,
        avgCompletionHours: 0,
      };

export const calculateUserScore = async (userId: string) => {
  const [total, completed] = await Promise.all([
    Task.countDocuments({ owner: userId }),
    Task.countDocuments({ owner: userId, status: 'completed' }),
  ]);
  return toMetric(total, completed);
};

export const getPerformanceForUser = async (userId: string) => {
  const metric = await PerformanceMetric.findOne({ user: userId }).sort({ snapshotDate: -1 }).lean();
  const user = await User.findById(userId).select('name email role').lean();
  if (metric) {
    const { score, tasksCompleted, tasksAssigned, onTimeCompletion, overdueTasks, avgCompletionHours } = metric;
    return { user, performance: { score, tasksCompleted, tasksAssigned, onTimeCompletion, overdueTasks, avgCompletionHours } };
  }
  const performance = await calculateUserScore(userId);
  await PerformanceMetric.create({ user: userId, ...performance, period: 'daily', snapshotDate: new Date() });
  return { user, performance };
};

// Leaderboard: latest snapshot per user, best first, capped. (60k rows in one response is not a page.)
export const getAllPerformance = async (limit = 50) => {
  const top = await PerformanceMetric.aggregate([
    { $sort: { user: 1, snapshotDate: -1 } },
    { $group: { _id: '$user', metric: { $first: '$$ROOT' } } },
    { $sort: { 'metric.score': -1, _id: 1 } },
    { $limit: Math.min(Math.max(limit, 1), 200) },
  ]);
  const users = await User.find({ _id: { $in: top.map((m) => m._id) } })
    .select('name email role department')
    .lean();
  const byId = new Map(users.map((u) => [u._id.toString(), u]));
  return top
    .filter((m) => byId.has(m._id.toString()))
    .map((m) => ({ user: byId.get(m._id.toString()), performance: m.metric }));
};

// One grouped scan + chunked bulk insert, instead of 2 queries per user.
export const snapshotAllPerformance = async () => {
  const rows = await Task.aggregate([
    {
      $group: {
        _id: '$owner',
        total: { $sum: 1 },
        done: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      },
    },
  ]);
  const snapshotDate = new Date();
  for (let i = 0; i < rows.length; i += 5000) {
    await PerformanceMetric.insertMany(
      rows.slice(i, i + 5000).map((r) => ({ user: r._id, ...toMetric(r.total, r.done), period: 'daily', snapshotDate })),
      { ordered: false }
    );
  }
  return { message: 'Performance snapshot taken', users: rows.length };
};
