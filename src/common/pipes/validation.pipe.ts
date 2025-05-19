import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass, ClassTransformOptions, ClassConstructor } from 'class-transformer';
import { BusinessException } from '../exceptions/business.exception';

@Injectable()
export class CustomValidationPipe implements PipeTransform<unknown> {
  async transform(value: unknown, { metatype, type }: ArgumentMetadata): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const options: ClassTransformOptions = { enableImplicitConversion: true };
    const object = plainToClass(metatype as ClassConstructor<object>, value as object, options);
    const errors = await validate(object);

    if (errors.length > 0) {
      // Get the first error message
      const firstError = errors[0];
      const constraints = firstError.constraints || {};
      const firstErrorMessage = Object.values(constraints)[0] || 'Invalid input';
      // For login route, only validate phone_number
      if (type === 'body' && value && typeof value === 'object' && 'phone_number' in value) {
        const phoneError = errors.find(error => error.property === 'phone_number');
        if (phoneError) {
          const phoneConstraints = phoneError.constraints || {};
          const phoneErrorMessage = Object.values(phoneConstraints)[0] || 'Invalid phone number';
          throw new BusinessException(phoneErrorMessage, 'VALIDATION_ERROR', {
            field: 'phone_number',
          });
        }
      }
      throw new BusinessException(firstErrorMessage, 'VALIDATION_ERROR', {
        field: firstError.property,
      });
    }

    return object;
  }

  private toValidate(metatype: new (...args: unknown[]) => unknown): boolean {
    const types: Array<new (...args: unknown[]) => unknown> = [
      String,
      Boolean,
      Number,
      Array,
      Object,
    ];
    return !types.includes(metatype);
  }
}
