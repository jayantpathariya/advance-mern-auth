import { Router } from 'express';

import {
  forgotPassword,
  login,
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

export default router;
