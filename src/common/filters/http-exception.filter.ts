import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { BusinessException } from '../exceptions/business.exception';
import { ApiResponse } from '../interfaces/api-response.interface';

interface ExceptionResponse {
  message: string;
  error: string;
  details?: Record<string, unknown>;
}

interface RequestWithBody extends Request {
  body: Record<string, unknown>;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithBody>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as ExceptionResponse;

    // Log the error with request details
    this.logger.error(`[${request.method}] ${request.url} - Status: ${status}`, {
      exception: {
        name: exception.name,
        message: exception.message,
        response: exceptionResponse,
        stack: exception.stack,
      },
      request: {
        method: request.method,
        url: request.url,
        body: request.body,
      },
    });

    let errorResponse: ApiResponse<null>;

    if (exception instanceof BusinessException) {
      errorResponse = {
        success: false,
        message: exceptionResponse.message,
        status,
        data: null,
        error: {
          code: exceptionResponse.error,
          details: exceptionResponse.details,
        },
      };
    } else {
      // Handle validation errors (BadRequestException)
      if (status === 400 && Array.isArray(exceptionResponse.message)) {
        this.logger.warn('Validation Error:', {
          errors: exceptionResponse.message,
          request: {
            body: request.body,
          },
        });

        errorResponse = {
          success: false,
          message: 'Validation failed',
          status,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            details: {
              errors: exceptionResponse.message,
            },
          },
        };
      } else {
        errorResponse = {
          success: false,
          message: exception.message,
          status,
          data: null,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
          },
        };
      }
    }

    response.status(status).json(errorResponse);
  }
}
