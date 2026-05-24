import PerformanceMetric from '../models/PerformanceMetric.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

export const calculateUserScore = async (userId: string) => {
  const tasks = await Task.find({ owner: userId });
  const total = tasks.length;
  if (total === 0) return { score: 0, tasksCompleted: 0, tasksAssigned: 0, onTimeCompletion: 0, overdueTasks: 0, avgCompletionHours: 0 };

  const completed = tasks.filter(t => t.status === 'completed');
  const completedCount = completed.length;
  const completionRate = completedCount / total;

  const score = Math.round(completionRate * 100);
  return { score, tasksCompleted: completedCount, tasksAssigned: total, onTimeCompletion: completedCount, overdueTasks: total - completedCount, avgCompletionHours: 0 };
};

export const getPerformanceForUser = async (userId: string) => {
  const metric = await PerformanceMetric.findOne({ user: userId }).sort({ snapshotDate: -1 });
  const user = await User.findById(userId).select('name email role').lean();
  const performance = metric
    ? { score: metric.score, tasksCompleted: metric.tasksCompleted, tasksAssigned: metric.tasksAssigned, onTimeCompletion: metric.onTimeCompletion, overdueTasks: metric.overdueTasks, avgCompletionHours: metric.avgCompletionHours }
    : { score: 0, tasksCompleted: 0, tasksAssigned: 0, onTimeCompletion: 0, overdueTasks: 0, avgCompletionHours: 0 };
  if (!metric) {
    const computed = await calculateUserScore(userId);
    Object.assign(performance, computed);
    await PerformanceMetric.create({ user: userId, ...computed, period: 'daily', snapshotDate: new Date() });
  }
  return { user, performance };
};

export const getAllPerformance = async () => {
  const [users, allMetrics] = await Promise.all([
    User.find().select('name email role department').lean(),
    PerformanceMetric.aggregate([
      { $sort: { snapshotDate: -1 } },
      { $group: { _id: '$user', metric: { $first: '$$ROOT' } } },
    ]),
  ]);
  const metricMap = new Map(allMetrics.map(m => [m._id.toString(), m.metric]));
  const results = users.map(user => ({
    user,
    performance: metricMap.get(user._id.toString())
      || { score: 0, tasksCompleted: 0, tasksAssigned: 0, onTimeCompletion: 0, overdueTasks: 0 },
  }));
  return results.sort((a: any, b: any) => b.performance.score - a.performance.score);
};

export const snapshotAllPerformance = async () => {
  const users = await User.find();
  for (const user of users) {
    const computed = await calculateUserScore(user._id.toString());
    await PerformanceMetric.create({ user: user._id, ...computed, period: 'daily', snapshotDate: new Date() });
  }
  return { message: 'Performance snapshot taken' };
};
