export enum Descriptions {
  // Auth Descriptions
  SIGNUP_SUMMARY = 'Register new user',
  LOGIN_SUMMARY = 'Login with phone number',
  VERIFY_OTP_SUMMARY = 'Verify OTP and get access token',

  // User Descriptions
  CREATE_USER_SUMMARY = 'Create a new user',
  GET_ALL_USERS_SUMMARY = 'Get all users',
  GET_USER_BY_ID_SUMMARY = 'Get a user by ID',
  UPDATE_USER_SUMMARY = 'Update a user',
  DELETE_USER_SUMMARY = 'Delete a user',

  // Field Descriptions
  USERNAME_DESC = 'Username of the user (3-50 characters)',
  PHONE_DESC = 'Phone number in E.164 format (e.g., +12345678900)',
  EMAIL_DESC = 'Email address of the user',
  ROLE_DESC = 'Role of the user (CUSTOMER, SELLER, or ADMIN)',
  OTP_DESC = 'One-time password (6 digits)',
  PASSWORD_DESC = 'Password of the user',
  TOKEN_DESC = 'JWT token for authentication',
  REFRESH_TOKEN_DESC = 'JWT refresh token',
  USER_ID_DESC = 'Unique identifier of the user',
  PROFILE_PICTURE_DESC = "URL of the user's profile picture",
  ABOUT_ME_DESC = 'Brief description about the user',
  CREATED_AT_DESC = 'Timestamp when the user was created',
  UPDATED_AT_DESC = 'Timestamp when the user was last updated',
  PHONE_FORMAT_DESC = 'Must be a valid US/Canada number starting with +1 followed by 10 digits',
  USER_LINK = 'User link',
  PROFILE_IMAGE_FILE = 'Profile image file',
  USER_PREFERENCES = 'User preferences',

  //Resend OTP DTO
  PHONE_NUMBER_DESCRIPTION = 'Phone number to resend OTP to',
  PURPOSE_OF_OTP = 'Purpose of the OTP',
  // Response Descriptions
  SIGNUP_SUCCESS_DESC = 'User registered successfully',
  LOGIN_SUCCESS_DESC = 'OTP sent successfully',
  VERIFY_OTP_SUCCESS_DESC = 'OTP verified successfully',
  EMAIL_EXISTS_DESC = 'Email already exists',
  USER_NOT_FOUND_DESC = 'User not found',
  INVALID_OTP_DESC = 'Invalid OTP',

  // Contact Descriptions
  CREATE_CONTACT_SUMMARY = 'Create a new contact',
  GET_ALL_CONTACTS_SUMMARY = 'Get all contacts',
  GET_CONTACT_BY_ID_SUMMARY = 'Get contact by ID',
  UPDATE_CONTACT_SUMMARY = 'Update contact by ID',
  DELETE_CONTACT_SUMMARY = 'Delete contact by ID',
  CONTACT_NAME_DESC = 'Name of the contact',
  CONTACT_ADDRESS_DESC = 'Address of the contact',
  SELLER_ID_DESC = 'ID of the seller who owns this contact',
  CONTACT_FULL_NAME_DESC = 'Full name of the contact',
  CONTACT_STATUS_DESC = 'Status of the contact (NEW, INVITED, ACCEPTED, REJECTED)',

  // Invitation Descriptions
  GET_INVITATION_BY_TOKEN_SUMMARY = 'Get invitation details by token',
  GET_INVITATION_BY_ID_SUMMARY = 'Get invitation details by ID',
  GET_INVITATIONS_BY_CONTACT_SUMMARY = 'Get all invitations for a contact',
  GET_INVITATIONS_BY_USERS_PHONE_NUMBER = 'Get all invitations for a user by phone number',
  INVITATION_TOKEN_DESC = 'Unique token of the invitation',
  INVITATION_ID_DESC = 'ID of the invitation',
  INVITATION_CONTACT_ID_DESC = 'ID of the contact',
  INVITATION_METHOD_DESC = 'Method used for invitation (SMS/EMAIL)',
  INVITATION_STATUS_DESC = 'Current status of the invitation',
}
