import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

interface ExceptionResponse {
  message?: string;
  error?: string;
  details?: Record<string, unknown>;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: Error | HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ApiResponse<null> = {
      success: false,
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
      },
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as ExceptionResponse;

      errorResponse = {
        success: false,
        message: exceptionResponse.message || exception.message,
        error: {
          code: exceptionResponse.error || 'UNKNOWN_ERROR',
          details: exceptionResponse.details,
        },
      };
    } else {
      // Log unexpected errors
      this.logger.error(`Unexpected error: ${exception.message}`, exception.stack);
    }

    // Log the error response
    this.logger.error(`Error Response: ${JSON.stringify(errorResponse)}`);

    response.status(status).json(errorResponse);
  }
}
