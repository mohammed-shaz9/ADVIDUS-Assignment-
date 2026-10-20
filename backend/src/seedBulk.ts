// Load-test dataset: ~60k employees + ~50k tasks, then times the hot admin queries.
//   npm run seed:bulk -- --yes                      (60000 users, 50000 tasks)
//   npm run seed:bulk -- --users=10000 --tasks=8000 --reset --yes
// Safety: refuses NODE_ENV=production, prints the target DB, and needs --yes. All rows use @seed.local emails,
// so --reset removes exactly what this script created. Login for any seeded user: Seed@12345
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import User from './models/User.js';
import Task from './models/Task.js';
import Department from './models/Department.js';
import * as adminService from './services/adminService.js';

const arg = (name: string, def: number) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? parseInt(hit.split('=')[1], 10) || def : def;
};
const flag = (name: string) => process.argv.includes(`--${name}`);

const USERS = arg('users', 60000);
const TASKS = arg('tasks', 50000);
const CHUNK = 5000;
const SEED_DOMAIN = /@seed\.local$/;
const STATUSES = ['pending', 'in_progress', 'completed'] as const;
const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];

const time = async <T>(label: string, fn: () => Promise<T>) => {
  const t = Date.now();
  const out = await fn();
  console.log(`  ${label.padEnd(34)} ${String(Date.now() - t).padStart(5)} ms`);
  return out;
};

if (env.nodeEnv === 'production') {
  console.error('Refusing to bulk-seed with NODE_ENV=production.');
  process.exit(1);
}
await connectDB();
const db = mongoose.connection;
console.log(`Target: ${db.host}/${db.name}  (${USERS} users, ${TASKS} tasks)`);
if (!flag('yes')) {
  console.error('Add --yes to confirm this is the database you want to fill.');
  await mongoose.disconnect();
  process.exit(1);
}

if (flag('reset')) {
  const old = await User.find({ email: SEED_DOMAIN }).select('_id').lean();
  await Task.deleteMany({ owner: { $in: old.map((u) => u._id) } });
  await User.deleteMany({ email: SEED_DOMAIN });
  console.log(`Reset: removed ${old.length} previous seed users and their tasks`);
}

await Promise.all([User.createIndexes(), Task.createIndexes()]);
const departments = await Department.find().select('_id').limit(50).lean();
const hash = await bcrypt.hash('Seed@12345', 10); // hash once: 60k bcrypt rounds would take ~an hour

const userIds: mongoose.Types.ObjectId[] = [];
await time(`insert ${USERS} users`, async () => {
  for (let i = 0; i < USERS; i += CHUNK) {
    const docs = Array.from({ length: Math.min(CHUNK, USERS - i) }, (_, k) => {
      const n = i + k;
      return {
        name: `Employee ${String(n).padStart(6, '0')}`,
        email: `u${n}@seed.local`,
        password: hash,
        role: 'user',
        status: n % 25 === 0 ? 'inactive' : 'active',
        department: departments.length ? departments[n % departments.length]._id : null,
        designation: 'Associate',
      };
    });
    const res = await User.insertMany(docs, { ordered: false });
    for (const u of res) userIds.push(u._id);
  }
});

await time(`insert ${TASKS} tasks`, async () => {
  for (let i = 0; i < TASKS; i += CHUNK) {
    const docs = Array.from({ length: Math.min(CHUNK, TASKS - i) }, (_, k) => {
      const owner = pick(userIds);
      return {
        title: `Survey task #${i + k}`,
        description: 'Quarterly field survey follow-up',
        status: pick(STATUSES),
        owner,
        assignedTo: { assigneeType: 'human', user: pick(userIds) },
      };
    });
    await Task.insertMany(docs, { ordered: false });
  }
});

console.log('Hot-path timings (cold, then warm = memoized):');
await time('admin users page 1', () => adminService.getUsers({ page: '1', limit: '50' }));
await time('admin users page 600 (deep)', () => adminService.getUsers({ page: '600', limit: '50' }));
await time('admin users search "Employee 0123"', () => adminService.getUsers({ q: 'Employee 0123' }));
await time('admin tasks page 1', () => adminService.getAdminTasks({ page: '1', limit: '25' }));
await time('admin tasks status filter', () => adminService.getAdminTasks({ status: 'completed' }));
await time('metrics (cold)', () => adminService.getMetrics());
await time('metrics (warm)', () => adminService.getMetrics());
await time('analytics top 20 (cold)', () => adminService.getAnalytics({ top: '20' }));
await time('activity logs page 1', () => adminService.getActivityLogs({}));

await mongoose.disconnect();
