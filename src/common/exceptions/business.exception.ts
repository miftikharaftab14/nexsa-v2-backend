import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(
      {
        message,
        error: code,
        details,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
