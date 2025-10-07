/**
 * Custom error classes for better error handling
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, public originalError?: any) {
    super(message, 'DATABASE_ERROR', 500);
    this.name = 'DatabaseError';
  }
}

/**
 * Format error for user display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Log error with context
 */
export function logError(error: unknown, context?: Record<string, any>) {
  console.error('Error occurred:', {
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle Supabase errors
 */
export function handleSupabaseError(error: any): never {
  logError(error);

  if (error.code === 'PGRST116') {
    throw new NotFoundError('Resource');
  }

  if (error.code === '23505') {
    throw new ValidationError('A record with this information already exists');
  }

  if (error.code === '23503') {
    throw new ValidationError('Referenced record does not exist');
  }

  if (error.message?.includes('JWT')) {
    throw new AuthenticationError();
  }

  throw new DatabaseError(error.message || 'Database operation failed', error);
}

/**
 * Safe async error handler wrapper
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, { function: fn.name, args });
      throw error;
    }
  }) as T;
}
