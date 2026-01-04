"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from '@/components/alignui/actions/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
import { Input } from '@/components/alignui/forms/input';
import { LabelRoot as Label } from '@/components/alignui/forms/label';
import { changePassword, type ChangePasswordFormData } from "@/actions/change-password";
import { validatePassword, passwordSchema } from "@/lib/validations/password-policy";
import { BadgeRoot as Badge } from '@/components/alignui/data-display/badge';
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function ChangePassword() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null);

  const changePasswordFormSchema = z.object({
    currentPassword: z.string().min(1, "Aktuelles Passwort ist erforderlich"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData & { confirmPassword: string }>({
    resolver: zodResolver(changePasswordFormSchema),
  });

  const newPassword = watch("newPassword");

  // Check password strength when new password changes
  useEffect(() => {
    if (newPassword) {
      const validation = validatePassword(newPassword);
      setPasswordStrength(validation.strength);
    } else {
      setPasswordStrength(null);
    }
  }, [newPassword]);

  const onSubmit = handleSubmit(async (data) => {
    startTransition(async () => {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (result.success) {
        toast.success("Passwort geändert", {
          description: "Ihr Passwort wurde erfolgreich geändert",
        });
        reset();
        setPasswordStrength(null);
        router.refresh();
      } else {
        toast.error("Fehler", {
          description: result.message,
        });
      }
    });
  });

  const getStrengthColor = () => {
    if (!passwordStrength) return "";
    switch (passwordStrength) {
      case "weak":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
    }
  };

  const getStrengthText = () => {
    if (!passwordStrength) return "";
    switch (passwordStrength) {
      case "weak":
        return "Schwach";
      case "medium":
        return "Mittel";
      case "strong":
        return "Stark";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="size-5 text-primary" />
          <CardTitle>Passwort ändern</CardTitle>
        </div>
        <CardDescription>
          Ändern Sie Ihr Passwort, um Ihr Konto sicher zu halten
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                {...register("currentPassword")}
                className="pr-10"
                placeholder="Aktuelles Passwort eingeben"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Neues Passwort</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                {...register("newPassword")}
                className="pr-10"
                placeholder="Neues Passwort eingeben"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {passwordStrength && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getStrengthColor()}`}
                      style={{
                        width:
                          passwordStrength === "weak"
                            ? "33%"
                            : passwordStrength === "medium"
                            ? "66%"
                            : "100%",
                      }}
                    />
                  </div>
                  <Badge
                    variant={
                      passwordStrength === "strong"
                        ? "default"
                        : passwordStrength === "medium"
                        ? "outline"
                        : "destructive"
                    }
                    className="text-xs"
                  >
                    {getStrengthText()}
                  </Badge>
                </div>
              </div>
            )}
            {errors.newPassword && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
                className="pr-10"
                placeholder="Passwort erneut eingeben"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <LoadingSpinner size="sm" variant="primary" />
                Passwort ändern...
              </>
            ) : (
              <>
                <Lock className="mr-2 size-4" />
                Passwort ändern
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

