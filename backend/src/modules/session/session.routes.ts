import { Router } from 'express';

import {
  deleteSession,
  getAllSessions,
  getCurrentSession,
} from '@controllers/session/session.controller';

const router = Router();

router.get('/all', getAllSessions);
router.get('/', getCurrentSession);
router.delete('/:sessionId', deleteSession);

export default router;
