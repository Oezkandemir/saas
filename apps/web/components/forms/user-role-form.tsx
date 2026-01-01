"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole, type FormData } from "@/actions/update-user-role";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { userRoleSchema } from "@/lib/validations/user";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { SectionColumns } from "@/components/dashboard/section-columns";
import { Icons } from "@/components/shared/icons";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useSupabase } from "@/components/supabase-provider";

export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
}

interface User {
  id: string;
  role: UserRole;
}

interface UserNameFormProps {
  user: Pick<User, "id" | "role">;
}

export function UserRoleForm({ user }: UserNameFormProps) {
  const { session, supabase } = useSupabase();
  const [updated, setUpdated] = useState(false);
  const [isPending, startTransition] = useTransition();
  const updateUserRoleWithId = updateUserRole.bind(null, user.id);
  const router = useRouter();
  const t = useTranslations("Settings.userRole");

  const roles = Object.values(UserRole);
  const [role, setRole] = useState(user.role || "USER");

  const form = useForm<FormData>({
    resolver: zodResolver(userRoleSchema),
    values: {
      role: role,
    },
  });

  const onSubmit = (data: z.infer<typeof userRoleSchema>) => {
    startTransition(async () => {
      const { status } = await updateUserRoleWithId(data);

      if (status !== "success") {
        toast.error("Something went wrong.", {
          description: "Your role was not updated. Please try again.",
        });
      } else {
        toast.success("Your role has been updated.");
        setUpdated(false);

        // Force a hard refresh to ensure all components update with the new data
        window.location.reload();
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SectionColumns title={t("title")} description={t("description")}>
          <div className="flex w-full items-center gap-2">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <div className="w-full space-y-0">
                  <div className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <select
                      className="w-full bg-transparent focus:outline-none"
                      value={role}
                      aria-label="Role"
                      onChange={(e) => {
                        const value = e.target.value as UserRole;
                        setUpdated(user.role !== value);
                        setRole(value);
                        field.onChange(value);
                      }}
                    >
                      <option value="" disabled>
                        Select a role
                      </option>
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  {form.formState.errors.role && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.role.message}
                    </p>
                  )}
                </div>
              )}
            />
            <Button
              type="submit"
              variant={updated ? "default" : "disable"}
              disabled={isPending || !updated}
              className="w-[67px] shrink-0 px-0 sm:w-[130px]"
            >
              {isPending ? (
                <LoadingSpinner size="sm" variant="primary" />
              ) : (
                <p>
                  Save
                  <span className="hidden sm:inline-flex">&nbsp;Changes</span>
                </p>
              )}
            </Button>
          </div>
          <div className="flex flex-col justify-between p-1">
            <p className="text-[13px] text-muted-foreground">
              {t("productionNote")}
            </p>
          </div>
        </SectionColumns>
      </form>
    </Form>
  );
}
