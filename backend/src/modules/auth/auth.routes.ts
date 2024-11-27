import { Router } from 'express';

import { authenticateJWT } from '@/common/strategies/jwt.strategy';

import {
  forgotPassword,
  login,
  logout,
  refreshToken,
  register,
  resetPassword,
  verifyEmail,
} from '@controllers/auth/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/refresh', refreshToken);
router.post('/verify/email', verifyEmail);
router.post('/password/forgot', forgotPassword);
router.post('/password/reset', resetPassword);
router.post('/logout', authenticateJWT, logout);

export default router;
