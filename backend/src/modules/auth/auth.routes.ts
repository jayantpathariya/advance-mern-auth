import { Router } from 'express';

import {
  login,
  refreshToken,
  register,
  verifyEmail,
} from '@controllers/auth/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/refresh', refreshToken);
router.post('/verify/email', verifyEmail);

export default router;
