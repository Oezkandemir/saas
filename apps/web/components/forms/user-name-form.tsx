"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserName, type FormData } from "@/actions/update-user-name";
import { User } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { userNameSchema } from "@/lib/validations/user";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/alignui/actions/button";
import { Input } from "@/components/alignui/forms/input";
import { LabelRoot as Label } from "@/components/alignui/forms/label";

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
          variant={updated ? "primary" : "outline"}
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
