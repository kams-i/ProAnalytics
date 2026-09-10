import express from 'express';
import type { Router } from 'express';
import { getAllOrganizationsController, getOrganizationByIdController, updateOrganizationController,deleteOrganizationController } from '../controllers/organizationController.ts';
import { authenticate,authorize } from '../middleware/authMiddleware.ts';
 // Adjust path if your RBAC middleware lives elsewhere

const router: Router = express.Router();

router.get('/all', authenticate, authorize('Super Admin'), getAllOrganizationsController);
router.get('/:id', authenticate, authorize('Super Admin'), getOrganizationByIdController);
router.put('/update/:id', authenticate, authorize('Super Admin'), updateOrganizationController);
router.delete('/delete/:id', authenticate, authorize('Super Admin'), deleteOrganizationController);


export default router;