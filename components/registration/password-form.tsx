"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePassword } from "@/lib/registration/password";

type PasswordFormProps = {
  password: string;
  confirmPassword: string;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  disabled?: boolean;
};

export function PasswordForm({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  disabled = false,
}: PasswordFormProps) {
  const validation = validatePassword(password, confirmPassword);
  const showHints = password.length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          required
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => onConfirmPasswordChange(event.target.value)}
          required
          disabled={disabled}
        />
      </div>

      {showHints ? (
        <ul className="space-y-1 text-xs text-black/55">
          {validation.errors.map((error) => (
            <li key={error} className="text-red-600">
              {error}
            </li>
          ))}
          {validation.valid ? (
            <li className="text-emerald-700">Password meets all requirements</li>
          ) : null}
        </ul>
      ) : (
        <p className="text-xs text-black/55">
          Minimum 10 characters with uppercase, lowercase, digit, and special
          character.
        </p>
      )}
    </div>
  );
}

export function isPasswordFormValid(
  password: string,
  confirmPassword: string,
): boolean {
  return validatePassword(password, confirmPassword).valid;
}
