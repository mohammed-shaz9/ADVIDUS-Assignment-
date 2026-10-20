import { Router } from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import * as orgController from '../controllers/orgController.js';
import * as orgService from '../services/orgService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuthenticatedRequest } from '../types/index.js';

const router = Router();
router.use(protect);

router.get('/departments', orgController.getDepartments);
router.get('/departments/tree', orgController.getDepartmentTree);
router.post('/departments', adminOnly, orgController.createDepartment);
router.put('/departments/:id', adminOnly, orgController.updateDepartment);
router.delete('/departments/:id', adminOnly, orgController.deleteDepartment);

router.get('/designations', orgController.getDesignations);
router.post('/designations', adminOnly, orgController.createDesignation);
router.put('/designations/:id', adminOnly, orgController.updateDesignation);
router.delete('/designations/:id', adminOnly, orgController.deleteDesignation);

router.get('/chart', orgController.getOrgChart);
router.get('/my-department', asyncHandler(async (req, res) => {
  const data = await orgService.getMyDepartmentStats((req as AuthenticatedRequest).user!._id.toString());
  res.json({ success: true, data, serverTime: new Date().toISOString() });
}));

export default router;
