import { Router } from 'express';

import { authenticateJWT } from '@/common/strategies/jwt.strategy';

import {
  generateMFASetup,
  revokeMFA,
  verifyMFAForLogin,
  verifyMFASetup,
} from '@controllers/mfa/mfa.controller';

const router = Router();

router.get('/setup', authenticateJWT, generateMFASetup);
router.post('/verify', authenticateJWT, verifyMFASetup);
router.put('/revoke', authenticateJWT, revokeMFA);
router.post('/verify-login', verifyMFAForLogin);

export default router;
