import { Router } from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import * as orgController from '../controllers/orgController.js';

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

export default router;
