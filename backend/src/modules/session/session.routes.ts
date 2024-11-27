import { Router } from 'express';

import { getAllSessions } from './session.controller';

const router = Router();

router.get('/all', getAllSessions);

export default router;
