import { Router } from 'express';

import {
  login,
  refreshToken,
  register,
} from '@controllers/auth/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/refresh', refreshToken);

export default router;
