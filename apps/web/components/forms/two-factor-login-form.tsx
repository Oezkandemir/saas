"use client";

import * as React from "react";
import { verifyTwoFactorCodeForSignIn } from "@/actions/two-factor-actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Shield } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TwoFactorLoginFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

const twoFactorSchema = z.object({
  code: z
    .string()
    .length(6, { message: "Code must be 6 digits" })
    .regex(/^\d+$/, { message: "Code must contain only numbers" }),
});

type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

export function TwoFactorLoginForm({
  userId,
  onSuccess,
  onCancel,
}: TwoFactorLoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const codeValue = watch("code");

  // Auto-submit when 6 digits are entered
  React.useEffect(() => {
    if (codeValue && codeValue.length === 6) {
      handleSubmit(onSubmit)();
    }
  }, [codeValue]);

  async function onSubmit(data: TwoFactorFormData) {
    setIsLoading(true);

    try {
      const result = await verifyTwoFactorCodeForSignIn(userId, data.code);

      if (!result.success) {
        throw new Error(result.message || "Invalid verification code");
      }

      toast.success("Verification successful", {
        description: "You are now logged in.",
      });

      onSuccess();
    } catch (error: any) {
      toast.error("Verification failed", {
        description:
          error.message || "Invalid verification code. Please try again.",
      });
      // Clear the code input
      setValue("code", "");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto md:border md:shadow-md">
      <CardHeader className="text-center px-4 pt-6 pb-4 md:px-6 md:pt-6">
        <div className="flex justify-center mb-2">
          <Shield className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-xl md:text-2xl">
          Two-Factor Authentication
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-6 md:px-6 md:pb-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 md:space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm md:text-base">
              Verification Code
            </Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              className="text-center text-2xl md:text-3xl font-mono tracking-widest h-14 md:h-16"
              disabled={isLoading}
              autoFocus
              {...register("code", {
                onChange: (e) => {
                  // Only allow numbers
                  const value = e.target.value.replace(/\D/g, "");
                  setValue("code", value.slice(0, 6), { shouldValidate: true });
                },
              })}
            />
            {errors?.code && (
              <p className="px-1 text-xs text-red-600">{errors.code.message}</p>
            )}
            <p className="text-xs md:text-sm text-muted-foreground text-center">
              Enter the code from your authenticator app or use a backup code
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className={cn(buttonVariants(), "flex-1 h-11 md:h-12 text-base")}
              disabled={isLoading || !codeValue || codeValue.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </button>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "w-full text-muted-foreground h-10 md:h-11",
              )}
              disabled={isLoading}
            >
              Cancel and sign out
            </button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
