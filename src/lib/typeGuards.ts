// Type Guards for Runtime Type Checking

// Basic type guards
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

// Null/Undefined checks
export function isNull(value: unknown): value is null {
  return value === null;
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

// Date validation
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

// Email validation
export function isValidEmail(value: unknown): value is string {
  if (!isString(value)) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

// URL validation
export function isValidUrl(value: unknown): value is string {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// Custom object type guards
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'student';
  created_at: string;
}

export function isUser(value: unknown): value is User {
  if (!isObject(value)) return false;
  
  return (
    isNumber((value as User).id) &&
    isValidEmail((value as User).email) &&
    isString((value as User).name) &&
    ['admin', 'teacher', 'student'].includes((value as User).role) &&
    isValidDate(new Date((value as User).created_at))
  );
}

export function isUserArray(value: unknown): value is User[] {
  return isArray(value) && value.every(isUser);
}

// Assessment type guards
export interface Assessment {
  id: number;
  name: string;
  description: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  status: 'draft' | 'active' | 'inactive';
  available_from: string;
  available_until: string;
}

export function isAssessment(value: unknown): value is Assessment {
  if (!isObject(value)) return false;
  
  const assessment = value as Assessment;
  
  return (
    isNumber(assessment.id) &&
    isString(assessment.name) && assessment.name.length > 0 &&
    isString(assessment.description) &&
    ['easy', 'medium', 'hard'].includes(assessment.difficulty_level) &&
    ['draft', 'active', 'inactive'].includes(assessment.status) &&
    isValidDate(new Date(assessment.available_from)) &&
    isValidDate(new Date(assessment.available_until))
  );
}

// Form validation helpers
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateUser(user: unknown): ValidationResult {
  const errors: string[] = [];
  
  if (!isObject(user)) {
    errors.push('User must be an object');
    return { isValid: false, errors };
  }
  
  const userObj = user as Record<string, unknown>;
  
  if (!isNumber(userObj.id)) {
    errors.push('User ID must be a number');
  }
  
  if (!isValidEmail(userObj.email)) {
    errors.push('User email must be a valid email address');
  }
  
  if (!isString(userObj.name) || userObj.name.length === 0) {
    errors.push('User name must be a non-empty string');
  }
  
  if (!['admin', 'teacher', 'student'].includes(userObj.role as string)) {
    errors.push('User role must be admin, teacher, or student');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// API Response validation
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function isValidApiResponse<T>(
  value: unknown, 
  dataValidator?: (data: unknown) => data is T
): value is ApiResponse<T> {
  if (!isObject(value)) return false;
  
  const response = value as ApiResponse<T>;
  
  if (!isBoolean(response.success)) return false;
  
  if (response.success) {
    // Success response should have data
    if (dataValidator) {
      return dataValidator(response.data);
    }
    return true;
  } else {
    // Error response should have error message
    return isString(response.error) || isString(response.message);
  }
}

// Database result validation
export interface DatabaseResult {
  affectedRows: number;
  insertId?: number;
  message?: string;
}

export function isValidDatabaseResult(value: unknown): value is DatabaseResult {
  if (!isObject(value)) return false;
  
  const result = value as DatabaseResult;
  
  return (
    isNumber(result.affectedRows) &&
    (result.insertId === undefined || isNumber(result.insertId)) &&
    (result.message === undefined || isString(result.message))
  );
}

// Utility function to safely access nested properties
export function safeGet<T>(
  obj: unknown, 
  path: string[], 
  validator?: (value: unknown) => value is T
): T | undefined {
  let current: unknown = obj;
  
  for (const key of path) {
    if (!isObject(current) || !(key in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  
  if (validator) {
    return validator(current) ? current : undefined;
  }
  
  return current as T;
}

// Runtime type assertion with validation
export function assertType<T>(
  value: unknown, 
  validator: (value: unknown) => value is T,
  errorMessage?: string
): T {
  if (!validator(value)) {
    throw new Error(errorMessage || `Invalid type: expected ${validator.name}`);
  }
  return value;
}

// Optional chaining with type guards
export function optionalChain<T>(
  obj: unknown,
  path: string[],
  validator: (value: unknown) => value is T
): T | undefined {
  const result = safeGet(obj, path);
  return result !== undefined && validator(result) ? result : undefined;
} 