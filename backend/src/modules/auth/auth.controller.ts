import { NextFunction, Request, Response } from 'express';

import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthenticationCookie,
} from '@/common/utils/cookie';
import {
  refreshTokenSignOptions,
  RefreshTPayload,
  signJWTToken,
  verifyJWTToken,
} from '@/common/utils/jwt';
import { config } from '@/config/app.config';

import { status } from '@config/http.config';

import SessionModel from '@models/session.model';
import UserModel from '@models/user.model';
import VerificationCodeModel from '@models/verification.model';

import { ErrorCode } from '@common/enums/error-code.enum';
import { VerificationEnum } from '@common/enums/verification-code.enum';
import {
  BadRequestException,
  UnauthorizedException,
} from '@common/utils/catch-errors';
import {
  calculateExpirationDate,
  fortyFiveMinutesFromNow,
  ONE_DAY_IN_MS,
} from '@common/utils/date-time';
import { loginSchema, registerSchema } from '@common/validators/auth-validator';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const body = registerSchema.parse(req.body);

    const { name, email, password } = body;

    const existingUser = await UserModel.exists({
      email,
    });

    if (existingUser) {
      throw new BadRequestException(
        'User already exists with this email',
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS,
      );
    }

    const newUser = await UserModel.create({
      name,
      email,
      password,
    });

    const verificationCode = await VerificationCodeModel.create({
      userId: newUser._id,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiresAt: fortyFiveMinutesFromNow(),
    });

    return res.status(status.CREATED).json({
      message: 'User registered successfully',
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const userAgentH = req.headers['user-agent'];
    const body = loginSchema.parse({ ...req.body, userAgentH });

    const { email, password, userAgent } = body;

    const user = await UserModel.findOne({
      email,
    });

    if (!user) {
      throw new BadRequestException(
        'Invalid email or password',
        ErrorCode.AUTH_USER_NOT_FOUND,
      );
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new BadRequestException(
        'Invalid email or password',
        ErrorCode.AUTH_USER_NOT_FOUND,
      );
    }

    const session = await SessionModel.create({
      userId: user._id,
      userAgent,
    });

    const accessToken = signJWTToken({
      userId: user._id,
      sessionId: session._id,
    });

    const refreshToken = signJWTToken(
      {
        sessionId: session._id,
      },
      refreshTokenSignOptions,
    );

    return setAuthenticationCookie({
      res,
      accessToken,
      refreshToken,
    })
      .status(status.OK)
      .json({
        message: 'User logged in successfully',
        user,
        mfaRequire: false,
      });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any> => {
  try {
    const refreshToken = req.cookies['refreshToken'] as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('User not authorized');
    }

    const { payload } = verifyJWTToken<RefreshTPayload>(refreshToken, {
      secret: refreshTokenSignOptions.secret,
    });

    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await SessionModel.findById(payload.sessionId);
    const now = Date.now();

    if (!session) {
      throw new UnauthorizedException('Session does not exist');
    }

    if (session.expiresAt.getTime() <= now) {
      throw new UnauthorizedException('Session expired');
    }
    const sessionRequiredRefresh =
      session.expiresAt.getTime() - now <= ONE_DAY_IN_MS;

    if (sessionRequiredRefresh) {
      session.expiresAt = calculateExpirationDate(
        config.JWT.REFRESH_EXPIRES_IN,
      );
      await session.save();
    }

    const newRefreshToken = sessionRequiredRefresh
      ? signJWTToken(
          {
            sessionId: session._id,
          },
          refreshTokenSignOptions,
        )
      : undefined;

    const accessToken = signJWTToken({
      userId: session.userId,
      sessionId: session._id,
    });

    if (newRefreshToken) {
      res.cookie(
        'refreshToken',
        newRefreshToken,
        getRefreshTokenCookieOptions(),
      );
    }

    return res
      .status(status.OK)
      .cookie('accessToken', accessToken, getAccessTokenCookieOptions())
      .json({
        message: 'Token refreshed successfully',
      });
  } catch (error) {
    next(error);
  }
};
