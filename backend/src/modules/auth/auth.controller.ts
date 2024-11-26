import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import VerificationCodeModel from "@models/verification.model";
import UserModel from "@models/user.model";
import SessionModel from "@models/session.model";

import { status } from "@config/http.config";
import { loginSchema, registerSchema } from "@common/validators/auth-validator";
import { BadRequestException } from "@common/utils/catch-errors";
import { ErrorCode } from "@common/enums/error-code.enum";
import { VerificationEnum } from "@common/enums/verification-code.enum";
import { fortyFiveMinutesFromNow } from "@common/utils/date-time";
import { config } from "@config/app.config";
import { setAuthenticationCookie } from "@/common/utils/cookie";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const body = registerSchema.parse(req.body);

    const { name, email, password } = body;

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

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const userAgentH = req.headers["user-agent"];
    const body = loginSchema.parse({ ...req.body, userAgentH });

    const { email, password, userAgent } = body;

    const user = await UserModel.findOne({
      email,
    });

    if (!user) {
      throw new BadRequestException(
        "Invalid email or password",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new BadRequestException(
        "Invalid email or password",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }

    const session = await SessionModel.create({
      userId: user._id,
      userAgent,
    });

    const accessToken = jwt.sign(
      { userId: user._id, sessionId: session._id },
      config.JWT.SECRET,
      {
        audience: ["user"],
        expiresIn: config.JWT.EXPIRES_IN,
      }
    );

    const refreshToken = jwt.sign(
      { sessionId: session._id },
      config.JWT.REFRESH_SECRET,
      {
        audience: ["user"],
        expiresIn: config.JWT.REFRESH_EXPIRES_IN,
      }
    );

    return setAuthenticationCookie({
      res,
      accessToken,
      refreshToken,
    })
      .status(status.OK)
      .json({
        message: "User logged in successfully",
        user,
        mfaRequire: false,
      });
  } catch (error) {
    next(error);
  }
};
