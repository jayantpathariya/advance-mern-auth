import { HttpStatusCode, status } from "@config/http.config";
import { ErrorCode } from "@enums/error-code.enum";
import { AppError } from "@utils/app-error";

export class NotFoundException extends AppError {
  constructor(message = "Resource not found", errorCode?: ErrorCode) {
    super(message, status.NOT_FOUND, errorCode || ErrorCode.RESOURCE_NOT_FOUND);
  }
}

export class BadRequestException extends AppError {
  constructor(message = "Bad Request", errorCode?: ErrorCode) {
    super(message, status.BAD_REQUEST, errorCode || ErrorCode.BAD_REQUEST);
  }
}

export class UnauthorizedException extends AppError {
  constructor(message = "Unauthorized Access", errorCode?: ErrorCode) {
    super(
      message,
      status.UNAUTHORIZED,
      errorCode || ErrorCode.ACCESS_UNAUTHORIZED
    );
  }
}

export class InternalServerException extends AppError {
  constructor(message = "Internal Server Error", errorCode?: ErrorCode) {
    super(
      message,
      status.INTERNAL_SERVER_ERROR,
      errorCode || ErrorCode.INTERNAL_SERVER_ERROR
    );
  }
}

export class HttpException extends AppError {
  constructor(
    message = "Http Exception Error",
    statusCode: HttpStatusCode,
    errorCode?: ErrorCode
  ) {
    super(message, statusCode, errorCode);
  }
}
