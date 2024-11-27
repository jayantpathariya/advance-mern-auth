import { Request, Response } from 'express';

import { hashValue } from '@/common/utils/bcrypt';
import {
  clearAuthenticationCookie,
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
import { sendEmail } from '@/mailers/mailer';
import {
  passwordResetTemplate,
  verifyEmailTemplate,
} from '@/mailers/templates/template';
import { asyncHandler } from '@/middlewares/async-handler';

import { status } from '@config/http.config';

import SessionModel from '@models/session.model';
import UserModel from '@models/user.model';
import VerificationCodeModel from '@models/verification.model';

import { ErrorCode } from '@common/enums/error-code.enum';
import { VerificationEnum } from '@common/enums/verification-code.enum';
import {
  BadRequestException,
  HttpException,
  InternalServerException,
  NotFoundException,
  UnauthorizedException,
} from '@common/utils/catch-errors';
import {
  calculateExpirationDate,
  fortyFiveMinutesFromNow,
  hourFromNow,
  ONE_DAY_IN_MS,
  threeMinutesAgo,
} from '@common/utils/date-time';
import {
  emailSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verificationEmailSchema,
} from '@common/validators/auth-validator';

export const register = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
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

    const verification = await VerificationCodeModel.create({
      userId: newUser._id,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiresAt: fortyFiveMinutesFromNow(),
    });

    const verificationUrl = `${config.APP_ORIGIN}/confirm-account?code=${verification.code}`;

    await sendEmail({
      to: newUser.email,
      ...verifyEmailTemplate(verificationUrl),
    });

    return res.status(status.CREATED).json({
      message: 'User registered successfully',
      data: newUser,
    });
  },
);

export const login = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
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
  },
);

export const refreshToken = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
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
  },
);

export const verifyEmail = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { code } = verificationEmailSchema.parse(req.body);

    const validCode = await VerificationCodeModel.findOne({
      code,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiresAt: { $gt: new Date() },
    });

    if (!validCode) {
      throw new NotFoundException('Invalid or expired verification code');
    }

    await UserModel.findByIdAndUpdate(
      validCode.userId,
      { isEmailVerified: true },
      { new: true },
    );

    await validCode.deleteOne();

    return res.status(status.OK).json({
      message: 'Email verified successfully',
    });
  },
);

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const email = emailSchema.parse(req.body.email);

    const user = await UserModel.findOne({
      email,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // check for mail rate limit
    const timeAgo = threeMinutesAgo();
    const maxAttempts = 2;

    const count = await VerificationCodeModel.countDocuments({
      userId: user._id,
      type: VerificationEnum.PASSWORD_RESET,
      createdAt: { $gt: timeAgo },
    });

    if (count >= maxAttempts) {
      throw new HttpException(
        'Too many requests, please try again later',
        status.TOO_MANY_REQUESTS,
        ErrorCode.AUTH_TOO_MANY_ATTEMPTS,
      );
    }

    const expiresAt = hourFromNow();
    const validCode = await VerificationCodeModel.create({
      userId: user._id,
      type: VerificationEnum.PASSWORD_RESET,
      expiresAt,
    });

    const resetLink = `${config.APP_ORIGIN}/reset-password?code=${validCode.code}&exp=${expiresAt.getTime()}`;

    const { data, error } = await sendEmail({
      to: user.email,
      ...passwordResetTemplate(resetLink),
    });

    if (!data?.id) {
      throw new InternalServerException(`${error?.name} ${error?.message}`);
    }

    return res.status(status.OK).json({
      message: 'Password reset link sent successfully',
    });
  },
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const { password, verificationCode } = resetPasswordSchema.parse(req.body);

    const validCode = await VerificationCodeModel.findOne({
      code: verificationCode,
      type: VerificationEnum.PASSWORD_RESET,
      expiresAt: { $gt: new Date() },
    });

    if (!validCode) {
      throw new NotFoundException('Invalid or expired verification code');
    }

    const hashedPassword = await hashValue(password);

    const updatedUser = await UserModel.findByIdAndUpdate(validCode.userId, {
      password: hashedPassword,
    });

    if (!updatedUser) {
      throw new BadRequestException('Failed to reset password');
    }

    await validCode.deleteOne();

    await SessionModel.deleteMany({
      userId: updatedUser._id,
    });

    return clearAuthenticationCookie(res).status(status.OK).json({
      message: 'Password reset successfully',
    });
  },
);
