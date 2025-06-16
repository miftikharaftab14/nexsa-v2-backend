export enum Messages {
  // Auth Messages
  USER_REGISTERED = 'User registered successfully',
  USER_NOT_FOUND = 'User not found',
  USER_NOT_INVITED = 'You are not invited by any seller',
  LOGIN_FAILED = 'Login failed',
  OTP_SENT = 'OTP sent successfully',
  OTP_VERIFIED = 'OTP verified successfully',
  INVALID_OTP = 'Invalid OTP',
  OTP_VERIFICATION_FAILED = 'OTP verification failed',
  USER_CREATION_FAILED = 'Failed to create user',
  EMAIL_ALREADY_EXISTS = 'Email already exists',
  PHONE_ALREADY_EXISTS = 'Phone number already exists',

  // User Messages
  USER_CREATED = 'User created successfully',
  USER_UPDATED = 'User updated successfully',
  USER_DELETED = 'User deleted successfully',
  USER_FETCHED = 'User retrieved successfully',
  USERS_FETCHED = 'Users retrieved successfully',
  USER_NOT_FOUND_BY_ID = 'User not found with the given ID',
  USER_NOT_FOUND_BY_EMAIL = 'User not found with the given email',
  USER_NOT_FOUND_BY_PHONE = 'User not found with the given phone number',

  // Validation Messages
  INVALID_EMAIL = 'Invalid email format',
  INVALID_PHONE = 'Invalid phone number format',
  INVALID_USERNAME = 'Invalid username format',
  EMAIL_REQUIRED = 'Email is required for sellers',
  PHONE_REQUIRED = 'Phone number is required',
  USERNAME_REQUIRED = 'Username is required',
  ROLE_REQUIRED = 'Role is required',

  // Auth Error Messages
  UNAUTHORIZED = 'Unauthorized',
  FORBIDDEN = 'Forbidden - Insufficient permissions',
  INVALID_INPUT = 'Invalid input data',
  BAD_REQUEST = 'Bad request - Invalid input data',

  // Contact Messages
  CONTACT_CREATED = 'Contact created successfully',
  CONTACT_UPDATED = 'Contact updated successfully',
  CONTACT_DELETED = 'Contact deleted successfully',
  CONTACT_FETCHED = 'Contact fetched successfully',
  CONTACTS_FETCHED = 'Contacts fetched successfully',
  CONTACT_NOT_FOUND = 'Contact not found',
  CONTACT_CREATION_FAILED = 'Failed to create contact',
  CONTACT_UPDATE_FAILED = 'Failed to update contact',
  CONTACT_DELETE_FAILED = 'Failed to delete contact',
  CONTACT_FETCH_FAILED = 'Failed to fetch contact',

  //Contact Invitaion
  INVITATION_CREATED = 'Invitation created successfully',
  INVITATION_CANCELLED = 'Invitation cancelled by seller',
  INVITATION_ACCEPTED = 'Invitation accepted successfully',
  INVITATION_NOT_FOUND = 'Invitation not found',
  INVITATION_ALREADY_PROCESSED = 'Invitation has already been processed',
  INVITATION_CREATION_FAILED = 'Failed to create invitation',
  INVITATION_CANCELLATION_FAILED = 'Failed to cancel invitation',
  INVITATION_ACCEPTANCE_FAILED = 'Failed to accept invitation',
  INVITATION_FETCHED = 'Invitation fetched successfully',
  INVITATIONS_FETCHED = 'Invitations fetched successfully',
  INVITATION_UPDATE_FAILED = 'Failed to update invitation',
  INVITATION_UPDATE_SUCCESS = 'Invitation updated successfully',
  // Profile Picture Messages
  PROFILE_PICTURE_UPDATED = 'Profile picture updated successfully',
  INVALID_FILE_TYPE = 'Invalid file type. Only jpg, jpeg, and png files are allowed.',

  //Categories Messages
  CATEGORY_CREATED = 'Category created successfully',
  CATEGORY_CREATION_FAILED = 'Failed to create category',

  CATEGORY_UPDATED = 'Category updated successfully',
  CATEGORY_UPDATE_FAILED = 'Failed to update category',

  CATEGORY_DELETED = 'Category deleted successfully',
  CATEGORY_DELETION_FAILED = 'Failed to delete category',

  CATEGORY_FETCHED = 'Category fetched successfully',
  CATEGORIES_FETCHED = 'Categories fetched successfully',
  CATEGORY_NOT_FOUND = 'Category not found',

  // Product Messages
  PRODUCT_CREATED = 'Product created successfully',
  PRODUCT_CREATION_FAILED = 'Failed to create product',

  PRODUCT_UPDATED = 'Product updated successfully',
  PRODUCT_UPDATE_FAILED = 'Failed to update product',

  PRODUCT_DELETED = 'Product deleted successfully',
  PRODUCT_DELETION_FAILED = 'Failed to delete product',

  PRODUCT_FETCHED = 'Product fetched successfully',
  PRODUCTS_FETCHED = 'Products fetched successfully',
  PRODUCT_NOT_FOUND = 'Product not found',
}
