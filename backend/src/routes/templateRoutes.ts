import { Router } from 'express';
import { protect, checkPermission } from '../middleware/authMiddleware.js';
import * as templateService from '../services/templateService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const templates = await templateService.getTemplates(req.query.active === 'true');
  res.json({ success: true, data: templates, serverTime: new Date().toISOString() });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const template = await templateService.getTemplate(req.params.id);
  res.json({ success: true, data: template, serverTime: new Date().toISOString() });
}));

router.post('/', checkPermission('tasks:write'), asyncHandler(async (req, res) => {
  const template = await templateService.createTemplate(req.body, (req as any).user._id);
  res.status(201).json({ success: true, data: template, serverTime: new Date().toISOString() });
}));

router.put('/:id', checkPermission('tasks:write'), asyncHandler(async (req, res) => {
  const template = await templateService.updateTemplate(req.params.id, req.body, (req as any).user._id);
  res.json({ success: true, data: template, serverTime: new Date().toISOString() });
}));

router.delete('/:id', checkPermission('tasks:delete'), asyncHandler(async (req, res) => {
  const result = await templateService.deleteTemplate(req.params.id, (req as any).user._id);
  res.json({ success: true, ...result, serverTime: new Date().toISOString() });
}));

router.post('/:id/generate', checkPermission('tasks:write'), asyncHandler(async (req, res) => {
  const task = await templateService.generateTasksFromTemplate(req.params.id, req.body.assigneeId, (req as any).user._id);
  res.status(201).json({ success: true, data: task, serverTime: new Date().toISOString() });
}));

export default router;
