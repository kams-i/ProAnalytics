import express from 'express';
import type { Router } from 'express';
import {signUp, signIn, requestOtpController, verifyOtpController, getAllUsersController, updateUserController, deleteUserController} from '../controllers/userController.ts';
import { authenticate } from '../middleware/authMiddleware.ts';
import validateUser from '../middleware/validateUser.ts';

const router: Router = express.Router();

router.post('/signup', validateUser, signUp);
router.post('/signin', signIn);
router.post('/request-otp', requestOtpController);
router.post('/verify-otp', verifyOtpController);
router.get('/all', authenticate, getAllUsersController);
router.put('/update/:id', authenticate, updateUserController);
router.delete('/delete/:id', authenticate, deleteUserController);
export default router;