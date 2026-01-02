"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { siteConfig } from "@/config/site";
import {
  sendEmailWithEdgeFunction,
  sendSignupConfirmationEmail,
  sendWelcomeEmail,
} from "@/lib/email-client";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/shared/icons";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useSupabase } from "@/components/supabase-provider";
import { checkTwoFactorEnabledByEmail } from "@/actions/two-factor-actions";
import { TwoFactorLoginForm } from "./two-factor-login-form";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: string;
  onSuccess?: () => void;
  redirectTo?: string;
}

const formSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});

type FormData = z.infer<typeof formSchema>;

export function UserAuthForm({
  className,
  type,
  onSuccess,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [showTwoFactor, setShowTwoFactor] = React.useState<boolean>(false);
  const [twoFactorUserId, setTwoFactorUserId] = React.useState<string | null>(null);
  const [userEmail, setUserEmail] = React.useState<string>("");
  const [storedPassword, setStoredPassword] = React.useState<string>(""); // Temporarily store password for 2FA flow
  const searchParams = useSearchParams();
  const { supabase } = useSupabase();
  const router = useRouter();

  const completeLogin = async (session: any) => {
    // CRITICAL: Do NOT update the role during login
    // The role should always come from the database, not from auth metadata
    // Updating the role here would reset admin roles to USER
    // If metadata needs updating, do it without touching the role
    // The role is managed by admins through the admin interface only

    // Track login session asynchronously (non-blocking for faster login)
    if (session) {
      const { trackLoginSession } = await import("@/actions/auth-actions");
      // Don't await - let it run in background for faster login
      trackLoginSession(
        session.access_token,
        session.expires_at!,
      ).catch((error) => {
        // Silently fail - session tracking shouldn't block login
        console.error("Failed to track login session:", error);
      });
    }

    toast.success("Successfully signed in", {
      description: "You are now logged in to your account.",
    });

    // Close modal after successful login
    if (onSuccess) {
      onSuccess();
    }

    // Determine redirect URL - check for redirectTo param or default to dashboard
    const finalRedirect = 
      redirectTo && redirectTo !== "/" && redirectTo !== "/login" 
        ? redirectTo 
        : "/dashboard";

    // Use window.location for immediate redirect (faster than router.push)
    // This prevents multiple redirects and loops
    window.location.href = finalRedirect;
  };

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    try {
      if (type === "register") {
        // Sign up with standard flow
        const signUpResult = await supabase.auth.signUp({
          email: data.email.toLowerCase(),
          password: data.password,
          options: {
            data: {
              name: data.email.split("@")[0], // Set a default name from email
              role: "USER", // Default role as string
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpResult.error) {
          throw signUpResult.error;
        }

        // Try to send custom confirmation and welcome emails
        try {
          // Extract the username from email
          const userName = data.email.split("@")[0];

          // Build the confirmation URL - use the site URL from config if available
          // This ensures we don't use localhost in production emails
          const baseUrl = siteConfig.url || window.location.origin;
          const confirmationUrl = `${baseUrl}/auth/callback?type=signup&id=${signUpResult.data.user?.id}`;

          // Send custom confirmation email
          await sendSignupConfirmationEmail({
            email: data.email,
            name: userName,
            actionUrl: confirmationUrl,
          });

          // Send welcome email
          await sendWelcomeEmail({
            email: data.email,
            name: userName,
          });

          // Create a welcome notification in the user's account
          await supabase.from("user_notifications").insert({
            user_id: signUpResult.data.user?.id,
            title: `Welcome to ${siteConfig.name}!`,
            content: `Thank you for signing up. We're excited to have you join us.`,
            type: "WELCOME",
            read: false,
          });

          toast.success("Account created successfully", {
            description:
              "We've sent you confirmation and welcome emails. Please check your inbox and follow the link to verify your account.",
          });
        } catch (emailError) {
          console.error("Error with email sending:", emailError);
          toast.success("Account created successfully", {
            description:
              "Check your email for a confirmation link. You need to confirm your email before signing in.",
          });
        }

        // Close modal after successful signup
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Check if user has 2FA enabled BEFORE signing in
        const email = data.email.toLowerCase();
        const twoFactorCheck = await checkTwoFactorEnabledByEmail(email);

        // Sign in with password
        const signInResult = await supabase.auth.signInWithPassword({
          email: email,
          password: data.password,
        });

        if (signInResult.error) {
          throw signInResult.error;
        }

        if (twoFactorCheck.success && twoFactorCheck.enabled && twoFactorCheck.userId) {
          // User has 2FA enabled - SECURITY: Delete session immediately
          // User must verify 2FA before being logged in
          await supabase.auth.signOut();
          
          // Store credentials temporarily for 2FA flow (in memory only)
          setTwoFactorUserId(twoFactorCheck.userId);
          setUserEmail(email);
          setStoredPassword(data.password); // Store password temporarily for re-login after 2FA
          setShowTwoFactor(true);
          setIsLoading(false);
          return; // Don't complete login yet - wait for 2FA verification
        }

        // No 2FA or 2FA not enabled - proceed with normal login
        await completeLogin(signInResult.data.session);
      }
    } catch (error) {
      // Log error (client-side logging)
      if (process.env.NODE_ENV === "development") {
        console.error("Authentication error:", error);
      }
      toast.error("Authentication failed", {
        description:
          error.message || "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }


  // Show 2FA form if 2FA is required
  if (showTwoFactor && twoFactorUserId && storedPassword) {
    return (
      <div className={cn("grid gap-6", className)} {...props}>
        <TwoFactorLoginForm
          userId={twoFactorUserId}
          email={userEmail}
          onSuccess={async () => {
            // 2FA verified successfully - now create session
            setIsLoading(true);
            try {
              // Re-authenticate with password after 2FA verification
              const signInResult = await supabase.auth.signInWithPassword({
                email: userEmail,
                password: storedPassword,
              });

              if (signInResult.error) {
                throw signInResult.error;
              }

              // Update login history to mark 2FA as used
              try {
                const { updateLoginHistoryWith2FA } = await import("@/lib/session-tracking");
                await updateLoginHistoryWith2FA(signInResult.data.session.access_token);
              } catch (error) {
                // Silently fail - logging shouldn't block login
                console.error("Failed to update login history:", error);
              }

              // Clear stored password immediately after use
              setStoredPassword("");
              setShowTwoFactor(false);
              setTwoFactorUserId(null);
              setUserEmail("");

              // Complete login with verified session
              await completeLogin(signInResult.data.session);
            } catch (error: any) {
              toast.error("Login failed", {
                description: error.message || "Please try signing in again.",
              });
              setStoredPassword("");
              setShowTwoFactor(false);
              setTwoFactorUserId(null);
              setUserEmail("");
              setIsLoading(false);
            }
          }}
          onCancel={() => {
            // Clear all state and ensure user is signed out
            setStoredPassword("");
            setShowTwoFactor(false);
            setTwoFactorUserId(null);
            setUserEmail("");
            // Ensure user is signed out
            supabase.auth.signOut().catch(() => {
              // Ignore errors
            });
            toast.info("Login cancelled", {
              description: "Please sign in again to continue.",
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...register("email")}
            />
            {errors?.email && (
              <p className="px-1 text-xs text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="password">
              Password
            </Label>
            <Input
              id="password"
              placeholder="Password"
              type="password"
              autoCapitalize="none"
              autoComplete={
                type === "register" ? "new-password" : "current-password"
              }
              autoCorrect="off"
              disabled={isLoading}
              {...register("password")}
            />
            {errors?.password && (
              <p className="px-1 text-xs text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            className={cn(buttonVariants())}
            disabled={isLoading}
            type="submit"
          >
            {isLoading && <LoadingSpinner size="sm" variant="primary" />}
            {type === "register" ? "Sign Up with Email" : "Sign In with Email"}
          </button>
        </div>
      </form>
    </div>
  );
}
