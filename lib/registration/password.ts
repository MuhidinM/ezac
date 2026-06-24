export type PasswordValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validatePassword(
  password: string,
  confirmPassword: string,
): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 10) {
    errors.push("Password must be at least 10 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must include at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must include at least one lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must include at least one digit");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must include at least one special character");
  }
  if (password !== confirmPassword) {
    errors.push("Passwords do not match");
  }

  return { valid: errors.length === 0, errors };
}
