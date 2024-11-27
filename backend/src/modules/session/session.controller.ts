import { Request, Response } from 'express';
import { z } from 'zod';

import { NotFoundException } from '@/common/utils/catch-errors';
import { status } from '@/config/http.config';
import SessionModel from '@/database/models/session.model';
import { asyncHandler } from '@/middlewares/async-handler';

export const getAllSessions = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userId = req.user?.id;
    const sessionId = req.sessionId;

    const sessions = await SessionModel.find(
      {
        userId,
        expiresAt: { $gt: Date.now() },
      },
      {
        _id: 1,
        userId: 1,
        userAgent: 1,
        expiresAt: 1,
      },
      {
        sort: { createdAt: -1 },
      },
    );

    const modifySessions = sessions.map((session) => ({
      ...session.toObject(),
      ...(session.id === sessionId && {
        isCurrent: true,
      }),
    }));

    return res.status(status.OK).json({
      message: 'Sessions fetched successfully',
      data: modifySessions,
    });
  },
);

export const getCurrentSession = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const session = req?.sessionId;

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const currentSession = await SessionModel.findById(session)
      .populate('userId')
      .select('-expiredAt');

    if (!currentSession) {
      throw new NotFoundException('Session not found');
    }

    const { userId: user } = currentSession;

    return res.status(status.OK).json({
      message: 'Current session fetched successfully',
      user,
    });
  },
);

export const deleteSession = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const sessionId = z.string().parse(req.params.sessionId);
    const userId = req.user?.id;

    const deletedSession = await SessionModel.findOneAndDelete({
      _id: sessionId,
      userId,
    });

    if (!deletedSession) {
      throw new NotFoundException('Session not found');
    }

    return res.status(status.OK).json({
      message: 'Session deleted successfully',
    });
  },
);
