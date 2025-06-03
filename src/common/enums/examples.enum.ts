export enum Examples {
  // User Examples
  USERNAME = 'johndoe',
  EMAIL = 'john@example.com',
  PHONE = '+12345678900',
  PHONE_WITH_SPACES = '+1 234 567 8900',
  PHONE_WITH_DASHES = '+1-234-567-8900',
  INVALID_PHONE = '1234567890', // Missing +1
  PROFILE_PICTURE = 'https://example.com/profile.jpg',
  LINK = 'https://example.com/',
  ABOUT_ME = 'Software developer with 5 years of experience',
  PREFERENCES = 'notifications_enabled',
  // JWT Examples
  JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',

  // OTP Examples
  OTP_CODE = '123456',

  // ID Examples
  USER_ID = 1,

  // Date Examples
  CREATED_AT = '2024-03-20T10:00:00Z',
  UPDATED_AT = '2024-03-21T10:00:00Z',

  // Role Examples
  CUSTOMER = 'CUSTOMER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',

  INVALID_OTP = 'INVALID_OTP',

  // Error Examples
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_INPUT = 'INVALID_INPUT',
  FORBIDDEN = 'FORBIDDEN',
  UNAUTHORIZED = 'UNAUTHORIZED',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  PHONE_ALREADY_EXISTS = 'PHONE_ALREADY_EXISTS',
  USER_CREATION_FAILED = 'USER_CREATION_FAILED',
  OTP_VERIFICATION_FAILED = 'OTP_VERIFICATION_FAILED',
  LOGIN_FAILED = 'LOGIN_FAILED',
  OTP_SENT = 'OTP_SENT',
  INVALID_PHONE_FORMAT = 'INVALID_PHONE_FORMAT',

  // Contact Examples
  CONTACT_ID = 12,
  CONTACT_NAME = 'John Doe',
  CONTACT_ADDRESS = '123 Main St, New York, NY 10001',

  // ...existing examples...
  INVITATION_ID = 11,
  INVITATION_TOKEN = 'abc123xyz',
  INVITATION_STATUS = 'REJECTED',

  FILE_ID = 1001,
  PRESIGNED_URL = 'https://example-bucket.s3.amazonaws.com/profile-pictures/user123.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...',
}
