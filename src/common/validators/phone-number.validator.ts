import { registerDecorator, ValidationOptions } from 'class-validator';
//ValidationArguments
export function IsUSPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUSPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          // _args: ValidationArguments
          if (typeof value !== 'string') return false;

          // Remove all non-digit characters
          const digitsOnly = value.replace(/\D/g, '');

          // If number starts with 1, remove it
          const numberWithoutCountryCode = digitsOnly.startsWith('1')
            ? digitsOnly.slice(1)
            : digitsOnly;

          // Check if it's a valid 10-digit US number
          return numberWithoutCountryCode.length === 10;
        },
        defaultMessage() {
          //_args: ValidationArguments
          return 'Must be a valid US phone number (10 digits)';
        },
      },
    });
  };
}
