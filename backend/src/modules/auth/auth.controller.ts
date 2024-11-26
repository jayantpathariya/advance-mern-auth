import { NextFunction, Request, Response } from "express";

import { status } from "../../config/http.config";
import {
  loginSchema,
  registerSchema,
} from "../../common/validators/auth-validator";
import UserModel from "../../database/models/user.model";
import { BadRequestException } from "../../common/utils/catch-errors";
import { ErrorCode } from "../../common/enums/error-code.enum";
import VerificationCodeModel from "../../database/models/verification.model";
import { VerificationEnum } from "../../common/enums/verification-code.enum";
import { fortyFiveMinutesFromNow } from "../../common/utils/date-time";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const body = registerSchema.safeParse(req.body);

    if (!body.success) {
      return res.status(status.BAD_REQUEST).json({
        message: "Validation failed",
        errors: body.error.errors,
      });
    }

    const { name, email, password } = body.data;

    const existingUser = await UserModel.exists({
      email,
    });

    if (existingUser) {
      throw new BadRequestException(
        "User already exists with this email",
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS
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
      message: "User registered successfully",
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};
