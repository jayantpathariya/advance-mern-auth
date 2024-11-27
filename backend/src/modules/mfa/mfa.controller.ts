import { Request, Response } from 'express';
import qrcode from 'qrcode';
import speakeasy from 'speakeasy';

import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@/common/utils/catch-errors';
import { setAuthenticationCookie } from '@/common/utils/cookie';
import { refreshTokenSignOptions, signJWTToken } from '@/common/utils/jwt';
import {
  verifyMfaForLoginSchema,
  verifyMfaSchema,
} from '@/common/validators/mfa-validator';
import { status } from '@/config/http.config';
import SessionModel from '@/database/models/session.model';
import UserModel from '@/database/models/user.model';
import { asyncHandler } from '@/middlewares/async-handler';

export const generateMFASetup = asyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('User not authorized');
    }

    if (user.userPreferences.enable2FA) {
      return res.status(status.BAD_REQUEST).json({
        message: 'MFA is already enabled',
      });
    }

    let secretKey = user.userPreferences.twoFactorSecret;

    if (!secretKey) {
      const secret = speakeasy.generateSecret({ name: 'Squeezy' });
      secretKey = secret.base32;
      user.userPreferences.twoFactorSecret = secretKey;
      await user.save();
    }

    const url = speakeasy.otpauthURL({
      secret: secretKey,
      label: user.name,
      issuer: 'squeezy.com',
      encoding: 'base32',
    });

    const qrImageUrl = await qrcode.toDataURL(url);

    res.json({
      message: 'Scan the QR code to setup MFA',
      secret: secretKey,
      qrcode: qrImageUrl,
    });
  },
);

export const verifyMFASetup = asyncHandler(
  async (req: Request, res: Response) => {
    const { code, secretKey } = verifyMfaSchema.parse({
      ...req.body,
    });

    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('User not authorized');
    }

    if (user.userPreferences.enable2FA) {
      return res.status(status.BAD_REQUEST).json({
        message: 'MFA is already enabled',
        userPreferences: {
          enable2FA: user.userPreferences.enable2FA,
        },
      });
    }

    const isValid = speakeasy.totp.verify({
      secret: secretKey,
      encoding: 'base32',
      token: code,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid MFA code, Please try again.');
    }

    user.userPreferences.enable2FA = true;
    await user.save();

    return res.status(status.BAD_REQUEST).json({
      message: 'MFA is enabled successfully',
      userPreferences: {
        enable2FA: user.userPreferences.enable2FA,
      },
    });
  },
);

export const revokeMFA = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new UnauthorizedException('User not authorized');
  }

  if (!user.userPreferences.enable2FA) {
    return res.status(status.BAD_REQUEST).json({
      message: 'MFA is not enabled',
    });
  }

  user.userPreferences.twoFactorSecret = undefined;
  user.userPreferences.enable2FA = false;
  await user.save();

  return res.status(status.OK).json({
    message: 'MFA is disabled successfully',
    userPreferences: {
      enable2FA: user.userPreferences.enable2FA,
    },
  });
});

export const verifyMFAForLogin = asyncHandler(
  async (req: Request, res: Response) => {
    const { code, email, userAgent } = verifyMfaForLoginSchema.parse({
      ...req.body,
      userAgent: req.headers['user-agent'],
    });

    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      !user.userPreferences.enable2FA &&
      !user.userPreferences.twoFactorSecret
    ) {
      throw new BadRequestException('MFA is not enabled for this user');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.userPreferences.twoFactorSecret!,
      encoding: 'base32',
      token: code,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid MFA code, Please try again.');
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
      });
  },
);
