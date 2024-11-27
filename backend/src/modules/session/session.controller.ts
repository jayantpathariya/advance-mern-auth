import { Request, Response } from 'express';

import { asyncHandler } from '@/middlewares/async-handler';

export const getAllSessions = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {},
);
