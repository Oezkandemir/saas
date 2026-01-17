"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { type FormData, updateUserName } from "@/actions/update-user-name";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { userNameSchema } from "@/lib/validations/user";
import type { User } from "@/types";

interface UserNameFormProps {
  user: Pick<User, "id" | "name">;
}

export function UserNameForm({ user }: UserNameFormProps) {
  const router = useRouter();
  const [updated, setUpdated] = useState(false);
  const [isPending, startTransition] = useTransition();
  const updateUserNameWithId = updateUserName.bind(null, user.id);
  const t = useTranslations("Settings.userName");

  const checkUpdate = (value: string) => {
    setUpdated(user.name !== value);
  };

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(userNameSchema),
    defaultValues: {
      name: user?.name || "",
    },
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const { status } = await updateUserNameWithId(data);

      if (status !== "success") {
        toast.error("Something went wrong.", {
          description: "Your name was not updated. Please try again.",
        });
      } else {
        setUpdated(false);
        toast.success("Your name has been updated.");

        // Use Next.js router to refresh the data without a full page reload
        router.refresh();
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="sr-only" htmlFor="name">
          {t("label")}
        </Label>
        <Input
          id="name"
          className="flex-1 h-9"
          size={32}
          {...register("name")}
          onChange={(e) => checkUpdate(e.target.value)}
          placeholder={t("label")}
        />
        <Button
          type="submit"
          variant={updated ? "default" : "outline"}
          size="sm"
          className="h-9 shrink-0 min-w-[80px]"
          disabled={isPending || !updated}
        >
          {isPending ? (
            <>
              <LoadingSpinner size="sm" variant="primary" />
              <span className="ml-2">Saving...</span>
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
      <div className="flex flex-col gap-1">
        {errors?.name && (
          <p className="text-xs text-destructive font-medium">
            {errors.name.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{t("maxChars")}</p>
      </div>
    </form>
  );
}
