import { CookieOptions, Response } from "express";

import { config } from "@config/app.config";
import { calculateExpirationDate } from "@utils/date-time";

type CookiePayloadType = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};

const defaults: CookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === "production",
  sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
};

export const REFRESH_PATH = `${config.BASE_PATH}/auth/refresh`;

export const getRefreshTokenCookieOptions = (): CookieOptions => {
  const expiresIn = config.JWT.REFRESH_EXPIRES_IN;
  const expires = calculateExpirationDate(expiresIn);

  return {
    ...defaults,
    expires,
    path: REFRESH_PATH,
  };
};

export const getAccessTokenCookieOptions = (): CookieOptions => {
  const expiresIn = config.JWT.EXPIRES_IN;
  const expires = calculateExpirationDate(expiresIn);

  return {
    ...defaults,
    expires,
    path: "/",
  };
};

export const setAuthenticationCookie = ({
  res,
  accessToken,
  refreshToken,
}: CookiePayloadType): Response => {
  res.cookie("accessToken", accessToken, getAccessTokenCookieOptions());
  res.cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

  return res;
};

export const clearAuthenticationCookie = (res: Response): Response => {
  res.clearCookie("accessToken").clearCookie("refreshToken", {
    path: REFRESH_PATH,
  });

  return res;
};
