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
import { useSupabase } from "@/components/supabase-provider";

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
  const searchParams = useSearchParams();
  const { supabase } = useSupabase();
  const router = useRouter();

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
        // Sign in with password
        const signInResult = await supabase.auth.signInWithPassword({
          email: data.email.toLowerCase(),
          password: data.password,
        });

        if (signInResult.error) {
          throw signInResult.error;
        }

        // If user metadata is missing, update it
        if (!signInResult.data.user.user_metadata?.name) {
          await supabase.auth.updateUser({
            data: {
              name: data.email.split("@")[0],
              role: "USER",
            },
          });
        }

        toast.success("Successfully signed in", {
          description: "You are now logged in to your account.",
        });

        // Close modal after successful login
        if (onSuccess) {
          onSuccess();
        }

        // Redirect to home or the specified redirect URL after successful login
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.push("/");
        }
        router.refresh();
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Authentication failed", {
        description:
          error.message || "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
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
            {isLoading && (
              <Icons.spinner className="mr-2 size-4 animate-spin" />
            )}
            {type === "register" ? "Sign Up with Email" : "Sign In with Email"}
          </button>
        </div>
      </form>
    </div>
  );
}
