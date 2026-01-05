import { z } from "zod";

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

/**
 * Validates password against policy
 * @param password Password to validate
 * @param policy Password policy to enforce
 * @returns Object with isValid flag and array of errors
 */
export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY,
): {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong";
} {
  const errors: string[] = [];
  let strengthScore = 0;

  // Length check
  if (password.length < policy.minLength) {
    errors.push(
      `Password must be at least ${policy.minLength} characters long`,
    );
  } else {
    strengthScore += 1;
  }

  // Uppercase check
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else if (policy.requireUppercase) {
    strengthScore += 1;
  }

  // Lowercase check
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else if (policy.requireLowercase) {
    strengthScore += 1;
  }

  // Numbers check
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  } else if (policy.requireNumbers) {
    strengthScore += 1;
  }

  // Special characters check
  if (
    policy.requireSpecialChars &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    errors.push("Password must contain at least one special character");
  } else if (policy.requireSpecialChars) {
    strengthScore += 1;
  }

  // Additional length bonus
  if (password.length >= 12) {
    strengthScore += 1;
  }
  if (password.length >= 16) {
    strengthScore += 1;
  }

  // Determine strength
  let strength: "weak" | "medium" | "strong" = "weak";
  if (strengthScore >= 5) {
    strength = "strong";
  } else if (strengthScore >= 3) {
    strength = "medium";
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Zod schema for password validation
 */
export const passwordSchema = z
  .string()
  .min(
    DEFAULT_PASSWORD_POLICY.minLength,
    `Password must be at least ${DEFAULT_PASSWORD_POLICY.minLength} characters`,
  )
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    "Password must contain at least one special character",
  );
