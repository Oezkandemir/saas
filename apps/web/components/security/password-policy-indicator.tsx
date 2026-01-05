"use client";

import { useMemo } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import {
  validatePassword,
  type PasswordPolicy,
} from "@/lib/validations/password-policy";

interface PasswordPolicyIndicatorProps {
  password: string;
  policy?: PasswordPolicy;
  showStrength?: boolean;
}

export function PasswordPolicyIndicator({
  password,
  policy,
  showStrength = true,
}: PasswordPolicyIndicatorProps) {
  const t = useTranslations("Security.passwordStrength");
  const validation = useMemo(() => {
    return validatePassword(password, policy);
  }, [password, policy]);

  const strengthColors = {
    weak: "bg-red-500",
    medium: "bg-yellow-500",
    strong: "bg-green-500",
  };

  const strengthLabels = {
    weak: t("weak"),
    medium: t("medium"),
    strong: t("strong"),
  };

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-2">
      {showStrength && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t("label")}</span>
            <span
              className={cn(
                "font-medium",
                validation.strength === "weak" && "text-red-500",
                validation.strength === "medium" && "text-yellow-500",
                validation.strength === "strong" && "text-green-500",
              )}
            >
              {strengthLabels[validation.strength]}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300",
                strengthColors[validation.strength],
                validation.strength === "weak" && "w-1/3",
                validation.strength === "medium" && "w-2/3",
                validation.strength === "strong" && "w-full",
              )}
            />
          </div>
        </div>
      )}

      {validation.errors.length > 0 && (
        <div className="space-y-1">
          {validation.errors.map((error, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-xs text-destructive"
            >
              <XCircle className="size-3 shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {validation.isValid && (
        <div className="flex items-center gap-2 text-xs text-green-500">
          <CheckCircle2 className="size-3 shrink-0" />
          <span>{t("valid")}</span>
        </div>
      )}
    </div>
  );
}
