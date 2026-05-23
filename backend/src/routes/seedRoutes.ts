import { Router, Request, Response } from 'express';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

router.post('/seed', async (req: Request, res: Response) => {
  const token = req.headers['x-seed-token'] as string;
  const expected = process.env.SEED_TOKEN;

  if (!expected || token !== expected) {
    return res.status(403).json({ success: false, message: 'Invalid seed token' });
  }

  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const seedPath = path.resolve(__dirname, '../seed.ts');
    execSync(`npx tsx ${seedPath}`, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    res.json({ success: true, message: 'Database seeded successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
