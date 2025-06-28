// Error message mapping for user-friendly display
export const ERROR_MESSAGES = {
  // Authentication Errors
  'INVALID_CREDENTIALS': 'Incorrect email or password. Please try again.',
  'ACCOUNT_NOT_VERIFIED': 'Please verify your email before logging in. Check your inbox for the verification link.',
  'TOKEN_EXPIRED': 'Your session has expired. Please log in again.',
  'INVALID_TOKEN': 'Invalid authentication. Please log in again.',

  // Validation Errors
  'EMAIL_EXISTS': 'This email is already registered. Try logging in instead.',
  'USERNAME_TAKEN': 'This username is taken. Please choose another one.',
  'VALIDATION_ERROR': 'Please check your input and try again.',
  'WEAK_PASSWORD': 'Password must be at least 8 characters long and contain letters and numbers.',

  // Profile Errors
  'PROFILE_INCOMPLETE': 'Please complete your profile before continuing.',
  'PROFILE_PICTURE_REQUIRED': 'Please add a profile picture to continue.',
  'BIO_TOO_LONG': 'Biography must be less than 500 characters.',
  'INVALID_AGE': 'You must be at least 18 years old to use this service.',

  // Network/System Errors
  'NETWORK_ERROR': 'Network error. Please check your connection and try again.',
  'SERVER_ERROR': 'Something went wrong on our end. Please try again in a moment.',
  'NOT_FOUND': 'The requested resource was not found.',
  'RATE_LIMITED': 'Too many requests. Please wait a moment before trying again.',

  // Success Messages
  'REGISTRATION_SUCCESS': 'Registration successful! Please check your email to verify your account.',
  'LOGIN_SUCCESS': 'Welcome back!',
  'PASSWORD_RESET_SENT': 'Password reset instructions have been sent to your email.',
  'PASSWORD_UPDATED': 'Password updated successfully.',
  'PROFILE_UPDATED': 'Profile updated successfully.',
  'EMAIL_VERIFIED': 'Email verified successfully! You can now log in.',
  'MESSAGE_SENT': 'Message sent successfully.',
  'LIKE_SENT': 'Like sent! We\'ll notify you if they like you back.',
  'MATCH_CREATED': 'It\'s a match! You can now start chatting.',
};

export interface ApiError {
  success: false;
  message: string;
  code?: string;
  field?: string;
  details?: string[];
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message: string;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: ApiError): string => {
  // If we have a specific error code, use the mapped message
  if (error.code && ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES]) {
    return ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES];
  }

  // If it's a validation error with details, show the first detail
  if (error.details && error.details.length > 0) {
    return error.details[0];
  }

  // Fall back to the server message
  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Get success message
 */
export const getSuccessMessage = (code: string): string => {
  return ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || 'Operation completed successfully.';
};

/**
 * Format field errors for form display
 */
export const formatFieldError = (error: ApiError): { field?: string; message: string } => {
  return {
    field: error.field,
    message: getErrorMessage(error)
  };
};

/**
 * Check if error is a network/connection issue
 */
export const isNetworkError = (error: any): boolean => {
  return !error.response || error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error');
};

/**
 * Enhanced error handler for API responses
 */
export const handleApiError = (error: any): ApiError => {
  // Handle network errors
  if (isNetworkError(error)) {
    return {
      success: false,
      message: ERROR_MESSAGES.NETWORK_ERROR,
      code: 'NETWORK_ERROR'
    };
  }

  // Handle axios errors with response
  if (error.response?.data) {
    const serverError = error.response.data;
    return {
      success: false,
      message: serverError.message || 'An error occurred',
      code: serverError.code,
      field: serverError.field,
      details: serverError.details
    };
  }

  // Handle other errors
  return {
    success: false,
    message: error.message || ERROR_MESSAGES.SERVER_ERROR,
    code: 'SERVER_ERROR'
  };
};
