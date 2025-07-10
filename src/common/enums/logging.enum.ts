export enum LogMessages {
  // Unknown Error
  UNKNOWN_ERROR = 'Unknown error: %s',

  // Auth Logs
  AUTH_SIGNUP_ATTEMPT = 'Attempting to signup user with phone: %s',
  AUTH_SIGNUP_SUCCESS = 'User successfully registered with phone: %s',
  AUTH_SIGNUP_FAILED = 'Signup failed: %s',
  AUTH_LOGIN_ATTEMPT = 'Attempting login for phone: %s',
  AUTH_LOGIN_SUCCESS = 'User successfully logged in with phone: %s',
  AUTH_LOGIN_FAILED = 'Login failed: %s',
  AUTH_OTP_SEND_ATTEMPT = 'Attempting to send OTP to phone: %s',
  AUTH_OTP_SEND_SUCCESS = 'OTP sent successfully to phone: %s',
  AUTH_OTP_SEND_FAILED = 'Failed to send OTP to phone: %s',
  AUTH_OTP_VERIFY_ATTEMPT = 'Attempting to verify OTP for phone: %s',
  AUTH_OTP_VERIFY_SUCCESS = 'OTP verified successfully for phone: %s',
  AUTH_OTP_VERIFY_FAILED = 'OTP verification failed for phone: %s',

  // User Logs
  USER_CREATE_ATTEMPT = 'Attempting to create user with phone: %s',
  USER_CREATE_SUCCESS = 'User created successfully with ID: %s',
  USER_CREATE_FAILED = 'Failed to create user: %s',
  USER_UPDATE_ATTEMPT = 'Attempting to update user with ID: %s',
  USER_UPDATE_SUCCESS = 'User updated successfully with ID: %s',
  USER_UPDATE_FAILED = 'Failed to update user with ID: %s',
  USER_DELETE_ATTEMPT = 'Attempting to delete user with ID: %s',
  USER_DELETE_SUCCESS = 'User deleted successfully with ID: %s',
  USER_DELETE_FAILED = 'Failed to delete user with ID: %s',
  USER_FETCH_ATTEMPT = 'Attempting to fetch user with ID: %s',
  USER_FETCH_SUCCESS = 'User fetched successfully with ID: %s',
  USER_FETCH_FAILED = 'Failed to fetch user with ID: %s',
  USER_NOT_FOUND = 'User not found with ID: %s',
  FAILED_IMAGE_PROCESS = 'Failed to process image',
  FAILED_TO_PARSE = 'Failed to parse the string',
  ATTEMPT_TO_FETCH_ALL_USER = 'Attempting to fetch all users',
  MISSING_AWS_CONFIGURATION = 'Missing required AWS configuration',

  // Validation Logs
  VALIDATION_ERROR = 'Validation Error: %s',
  VALIDATION_SUCCESS = 'Validation successful for %s',

  // System Logs
  SYSTEM_STARTUP = 'Application is running on: %s',
  SYSTEM_SHUTDOWN = 'Application is shutting down',
  SYSTEM_ERROR = 'System Error: %s',
  SYSTEM_WARNING = 'System Warning: %s',
  SYSTEM_INFO = 'System Info: %s',

  // Database Logs
  DB_CONNECTION_SUCCESS = 'Database connection established successfully',
  DB_CONNECTION_FAILED = 'Database connection failed: %s',
  DB_QUERY_SUCCESS = 'Database query executed successfully',
  DB_QUERY_FAILED = 'Database query failed: %s',

  // API Logs
  API_REQUEST_START = '[%s] %s - Request started',
  API_REQUEST_END = '[%s] %s - Request completed in %s ms',
  API_REQUEST_FAILED = '[%s] %s - Request failed: %s',
  API_RATE_LIMIT = 'Rate limit exceeded for IP: %s',

  // Twilio Logs
  TWILIO_CONFIG_MISSING = 'Twilio configuration is missing',
  TWILIO_SERVICE_INITIALIZED = 'Twilio service initialized successfully',
  MAX_RESEND_ATTEMPTS_REACHED = 'Please try again later. Maximum resend attempts reached for phone: %s',
  RESEND_COOLDOWN_EXPIRED = 'Resend cooldown expired for phone: %s',
  OTP_RESEND_ATTEMPT = 'Attempting to resend OTP to phone: %s',
  OTP_RESEND_SUCCESS = 'OTP resent successfully to phone: %s',
  OTP_RESEND_FAILED = 'Failed to resend OTP to phone: %s',
  NO_ACTIVE_OTP = 'No active OTP found to resend.',
  TOO_MANY_ATTEMPTS = 'Account is locked due to too many failed attempts.',
  EXPIRED_OTP_TRY_AGAIN = 'OTP has expired. Please request a new one.',
  INVALID_OTP = 'Invalid OTP code.',

  //File Logs
  FILE_SIZE_LIMT = 'File size should not exceed 5MB',
  FILE_TYPE_JPG_PNG = 'Only JPEG and PNG images are allowed',

  // Contact Log Messages
  CONTACT_CREATE_ATTEMPT = 'Attempting to create contact',
  CONTACT_CREATE_SUCCESS = 'Contact created successfully with ID: %s',
  CONTACT_CREATE_FAILED = 'Failed to create contact: %s',
  CONTACT_FETCH_ATTEMPT = 'Attempting to fetch contact',
  CONTACT_FETCH_SUCCESS = 'Contact fetched successfully',
  CONTACT_FETCH_FAILED = 'Failed to fetch contact: %s',
  CONTACT_UPDATE_ATTEMPT = 'Attempting to update contact with ID: %s',
  CONTACT_UPDATE_SUCCESS = 'Contact updated successfully with ID: %s',
  CONTACT_UPDATE_FAILED = 'Failed to update contact: %s',
  CONTACT_DELETE_ATTEMPT = 'Attempting to delete contact with ID: %s',
  CONTACT_DELETE_SUCCESS = 'Contact deleted successfully with ID: %s',
  CONTACT_DELETE_FAILED = 'Failed to delete contact: %s',

  // Contact Invitation Log Messages
  INVITATION_CREATE_ATTEMPT = 'Attempting to create invitation',
  INVITATION_CREATE_SUCCESS = 'Invitation created successfully with ID: %s',
  INVITATION_CREATE_FAILED = 'Failed to create invitation: %s',

  INVITATION_CANCEL_ATTEMPT = 'Attempting to cancel invitation with ID: %s',
  INVITATION_CANCEL_SUCCESS = 'Invitation cancelled successfully with ID: %s',
  INVITATION_CANCEL_FAILED = 'Failed to cancel invitation: %s',

  INVITATION_ACCEPT_ATTEMPT = 'Attempting to accept invitation with token: %s',
  INVITATION_ACCEPT_SUCCESS = 'Invitation accepted successfully with token: %s',
  INVITATION_ACCEPT_FAILED = 'Failed to accept invitation: %s',

  INVITATION_FETCH_ATTEMPT = 'Attempting to fetch invitation with identifier: %s',
  INVITATION_FETCH_ATTEMPT_BY_CUSTOMER = 'Attempting to fetch invitation with customer: %s',
  INVITATION_FETCH_SUCCESS = 'Invitation fetched successfully with identifier: %s',
  INVITATION_FETCH_FAILED = 'Failed to fetch invitation: %s',
  INVITATION_UPDATE_FAILED = 'Failed to update invitation: %s',
  INVITATION_UPDATE_SUCCESS = 'Invitation updated successfully with ID: %s',
  INVITATION_UPDATE_ATTEMPT = 'Attempting to update invitation with ID: %s',

  FILE_UPLOAD_FAILED = 'Failed to upload file',
  FILE_REQUEST_FAILED = 'File to generate file upload request',
  FILE_NOT_FOUND = 'File not found',
  FILE_DELETE_FAILED = 'Failed to delete file',

  // Preference Log Messages
  PREFERENCE_FETCH_ATTEMPT = 'Attempting to fetch preference: %s',
  PREFERENCE_FETCH_SUCCESS = 'Preference fetched successfully: %s',
  PREFERENCE_FETCH_FAILED = 'Failed to fetch preference: %s',
  PREFERENCE_NOT_FOUND = 'Preference not found: %s',
}

export enum LogLevels {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

export enum LogContexts {
  AUTH = 'AuthService',
  USER = 'UserService',
  S3 = 'S3Service',
  CONTACT = 'ContactService',
  CONTACT_INVITATION = 'CONTACT_INVITATION',
  FILE = 'File',
  EMAIL = 'EMAIL',
  SMSINVITAIONSTRATEGY = 'SMSInvitationStrategy',
  PREFERENCE = 'PreferenceService',
}
