import { Router } from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import * as settingsService from '../services/settingsService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const settings = await settingsService.getAllSettings(req.query.group as string);
  res.json({ success: true, data: settings, serverTime: new Date().toISOString() });
}));

router.get('/integrations', asyncHandler(async (req, res) => {
  const integrations = await settingsService.getIntegrations();
  res.json({ success: true, data: integrations, serverTime: new Date().toISOString() });
}));

router.put('/:key', adminOnly, asyncHandler(async (req, res) => {
  const setting = await settingsService.updateSetting(req.params.key as string, req.body.value, (req as any).user._id);
  res.json({ success: true, data: setting, serverTime: new Date().toISOString() });
}));

export default router;
