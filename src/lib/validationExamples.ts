// Practical Examples of Type Validation in the Application

import { 
  isUser, 
  isAssessment, 
  isValidEmail, 
  isNumber, 
  isString, 
  validateUser,
  isValidApiResponse,
  safeGet,
  assertType
} from './typeGuards';

// Example 1: API Response Validation
export async function fetchUserWithValidation(userId: number) {
  try {
    const response = await fetch(`/api/admin/users/${userId}`);
    const data = await response.json();
    
    // Validate the API response structure
    if (!isValidApiResponse(data, isUser)) {
      throw new Error('Invalid API response format');
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch user');
    }
    
    // At this point, TypeScript knows data.data is a User
    const user = data.data;
    console.log(`User ${user.name} (${user.email}) loaded successfully`);
    
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// Example 2: Form Data Validation
export function validateAssessmentForm(formData: unknown) {
  const errors: string[] = [];
  
  if (!isAssessment(formData)) {
    // Check individual fields for better error messages
    if (!isString((formData as any)?.name) || (formData as any)?.name?.length === 0) {
      errors.push('Assessment name is required');
    }
    
    if (!isString((formData as any)?.description)) {
      errors.push('Assessment description is required');
    }
    
    if (!['easy', 'medium', 'hard'].includes((formData as any)?.difficulty_level)) {
      errors.push('Difficulty level must be easy, medium, or hard');
    }
    
    return { isValid: false, errors };
  }
  
  // Additional business logic validation
  const assessment = formData;
  const availableFrom = new Date(assessment.available_from);
  const availableUntil = new Date(assessment.available_until);
  
  if (availableFrom >= availableUntil) {
    errors.push('Available until date must be after available from date');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Example 3: Database Result Validation
export function validateDatabaseInsertResult(result: unknown) {
  if (!isNumber((result as any)?.affectedRows)) {
    throw new Error('Invalid database result: missing affectedRows');
  }
  
  if ((result as any)?.affectedRows !== 1) {
    throw new Error(`Expected 1 row to be affected, got ${(result as any)?.affectedRows}`);
  }
  
  return result;
}

// Example 4: Safe Property Access
export function extractUserEmailFromResponse(response: unknown): string | undefined {
  // Safely navigate nested properties
  return safeGet(response, ['data', 'user', 'email'], isValidEmail);
}

// Example 5: Runtime Type Assertion
export function processUserData(data: unknown) {
  try {
    // Assert that data is a User at runtime
    const user = assertType(data, isUser, 'Invalid user data format');
    
    // Now TypeScript knows user is a User type
    return {
      id: user.id,
      email: user.email,
      displayName: user.name,
      role: user.role
    };
  } catch (error) {
    console.error('User data validation failed:', error);
    throw error;
  }
}

// Example 6: Array Validation
export function validateUserArray(users: unknown) {
  if (!Array.isArray(users)) {
    throw new Error('Expected an array of users');
  }
  
  const validUsers = [];
  const invalidUsers = [];
  
  for (let i = 0; i < users.length; i++) {
    if (isUser(users[i])) {
      validUsers.push(users[i]);
    } else {
      invalidUsers.push({ index: i, data: users[i] });
    }
  }
  
  if (invalidUsers.length > 0) {
    console.warn('Some users failed validation:', invalidUsers);
  }
  
  return validUsers;
}

// Example 7: Conditional Validation
export function validateUserBasedOnRole(user: unknown) {
  if (!isUser(user)) {
    throw new Error('Invalid user data');
  }
  
  const validationErrors: string[] = [];
  
  // Role-specific validation
  switch (user.role) {
    case 'admin':
      // Admins might need additional validation
      if (!user.email.includes('admin')) {
        validationErrors.push('Admin emails should contain "admin"');
      }
      break;
      
    case 'teacher':
      // Teachers might need institution validation
      if (!user.email.includes('edu')) {
        validationErrors.push('Teacher emails should be educational');
      }
      break;
      
    case 'student':
      // Students might need age validation (if we had age field)
      break;
      
    default:
      validationErrors.push(`Unknown role: ${user.role}`);
  }
  
  return {
    isValid: validationErrors.length === 0,
    errors: validationErrors
  };
}

// Example 8: API Error Handling with Type Validation
export async function safeApiCall<T>(
  apiCall: () => Promise<Response>,
  validator: (data: unknown) => data is T
): Promise<T> {
  try {
    const response = await apiCall();
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    if (!validator(data)) {
      throw new Error('Response data failed validation');
    }
    
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Example 9: Form Input Validation
export function validateFormInput(
  value: unknown, 
  fieldName: string, 
  validators: Array<(value: unknown) => boolean | string>
): string[] {
  const errors: string[] = [];
  
  for (const validator of validators) {
    const result = validator(value);
    if (result !== true) {
      errors.push(typeof result === 'string' ? result : `${fieldName} is invalid`);
    }
  }
  
  return errors;
}

// Example 10: Configuration Validation
export function validateAppConfig(config: unknown) {
  const requiredFields = ['databaseUrl', 'apiKey', 'environment'];
  const errors: string[] = [];
  
  if (!isObject(config)) {
    return { isValid: false, errors: ['Configuration must be an object'] };
  }
  
  const configObj = config as Record<string, unknown>;
  
  for (const field of requiredFields) {
    if (!(field in configObj) || isNullOrUndefined(configObj[field])) {
      errors.push(`Missing required configuration field: ${field}`);
    }
  }
  
  // Validate specific fields
  if (isString(configObj.databaseUrl) && !configObj.databaseUrl.startsWith('mysql://')) {
    errors.push('Database URL must be a valid MySQL connection string');
  }
  
  if (isString(configObj.environment) && !['development', 'production', 'test'].includes(configObj.environment)) {
    errors.push('Environment must be development, production, or test');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper function for null/undefined check
function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
} 