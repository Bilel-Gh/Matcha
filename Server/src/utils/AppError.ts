export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: string[];
  public readonly field?: string;
  public readonly code?: string;

  constructor(
    message: string | string[],
    statusCode: number = 500,
    isOperational: boolean = true,
    field?: string,
    code?: string
  ) {
    const mainMessage = Array.isArray(message) ? 'Validation Error' : message;
    super(mainMessage);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.field = field;
    this.code = code;

    if (Array.isArray(message)) {
      this.details = message;
    }

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string | string[], field?: string) {
    super(message, 400, true, field, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', code: string = 'AUTH_FAILED') {
    super(message, 401, true, undefined, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true, undefined, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, field?: string, code?: string) {
    super(message, 409, true, field, code || 'CONFLICT');
  }
}

export class EmailExistsError extends ConflictError {
  constructor() {
    super('Email already exists', 'email', 'EMAIL_EXISTS');
  }
}

export class UsernameExistsError extends ConflictError {
  constructor() {
    super('Username already taken', 'username', 'USERNAME_TAKEN');
  }
}
