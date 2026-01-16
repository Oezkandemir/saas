/**
 * Validation utilities
 */

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Email validation
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, message: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: "Invalid email format" };
  }

  return { valid: true };
}

/**
 * URL validation
 */
export function validateURL(url: string): ValidationResult {
  if (!url) {
    return { valid: false, message: "URL is required" };
  }

  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, message: "Invalid URL format" };
  }
}

/**
 * Phone number validation (basic)
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { valid: false, message: "Phone number is required" };
  }

  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    return { valid: false, message: "Invalid phone number format" };
  }

  return { valid: true };
}

/**
 * Required field validation
 */
export function validateRequired(value: any): ValidationResult {
  if (value === null || value === undefined || value === "") {
    return { valid: false, message: "This field is required" };
  }

  if (typeof value === "string" && value.trim() === "") {
    return { valid: false, message: "This field is required" };
  }

  return { valid: true };
}

/**
 * Min length validation
 */
export function validateMinLength(
  value: string,
  min: number
): ValidationResult {
  if (value.length < min) {
    return {
      valid: false,
      message: `Must be at least ${min} characters`,
    };
  }

  return { valid: true };
}

/**
 * Max length validation
 */
export function validateMaxLength(
  value: string,
  max: number
): ValidationResult {
  if (value.length > max) {
    return {
      valid: false,
      message: `Must be no more than ${max} characters`,
    };
  }

  return { valid: true };
}

/**
 * Number range validation
 */
export function validateRange(
  value: number,
  min: number,
  max: number
): ValidationResult {
  if (value < min || value > max) {
    return {
      valid: false,
      message: `Must be between ${min} and ${max}`,
    };
  }

  return { valid: true };
}

/**
 * Combine multiple validators
 */
export function combineValidators(
  ...validators: Array<(value: any) => ValidationResult>
) {
  return (value: any): ValidationResult => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true };
  };
}
