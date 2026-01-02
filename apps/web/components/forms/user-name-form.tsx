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
import { Button } from '@/components/alignui/actions/button';
import { Input } from '@/components/alignui/forms/input';
import { Label } from "@/components/ui/label";
import { SectionColumns } from "@/components/dashboard/section-columns";
import { Icons } from "@/components/shared/icons";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useSupabase } from "@/components/supabase-provider";

interface UserNameFormProps {
  user: Pick<User, "id" | "name">;
}

export function UserNameForm({ user }: UserNameFormProps) {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [updated, setUpdated] = useState(false);
  const [isPending, startTransition] = useTransition();
  const updateUserNameWithId = updateUserName.bind(null, user.id);
  const t = useTranslations("Settings.userName");

  const checkUpdate = (value) => {
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
    <form onSubmit={onSubmit}>
      <SectionColumns title={t("title")} description={t("description")}>
        <div className="flex w-full items-center gap-2">
          <Label className="sr-only" htmlFor="name">
            {t("label")}
          </Label>
          <Input
            id="name"
            className="flex-1"
            size={32}
            {...register("name")}
            onChange={(e) => checkUpdate(e.target.value)}
            placeholder={t("label")}
          />
          <Button
            type="submit"
            variant={updated ? "default" : "outline"}
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
          {errors?.name && (
            <p className="pb-0.5 text-[13px] text-red-600">
              {errors.name.message}
            </p>
          )}
          <p className="text-[13px] text-muted-foreground">{t("maxChars")}</p>
        </div>
      </SectionColumns>
    </form>
  );
}
