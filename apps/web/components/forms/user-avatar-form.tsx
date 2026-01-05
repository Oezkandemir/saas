"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { updateUserAvatar } from "@/actions/update-user-avatar";
import { User } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { userAvatarSchema } from "@/lib/validations/user";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/alignui/actions/button";
import { useAvatar } from "@/components/context/avatar-context";
import { Icons } from "@/components/shared/icons";

interface UserAvatarFormProps {
  user: Pick<User, "id"> & {
    avatar_url?: string | null;
  };
}

export function UserAvatarForm({ user }: UserAvatarFormProps) {
  const router = useRouter();
  const { updateAvatarUrl } = useAvatar();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user.avatar_url || null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const t = useTranslations("Settings.profilePicture");

  const {
    register,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(userAvatarSchema),
  });

  const { ref, onChange, ...rest } = register("avatar");

  // Function to combine react-hook-form ref and our local ref
  const setRefs = (element: HTMLInputElement | null) => {
    // Call the react-hook-form ref
    ref(element);
    // Set our local ref
    fileInputRef.current = element;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Call the react-hook-form onChange handler
    onChange(event);

    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    setShowSaveButton(true);
  };

  const handleAvatarUpload = () => {
    if (!selectedFile) return;

    startTransition(async () => {
      // Create FormData to pass to server action
      const formData = new FormData();
      formData.append("avatar", selectedFile);

      const result = await updateUserAvatar(user.id, formData);

      if (result.status !== "success") {
        toast.error("Avatar upload failed", {
          description: result.message || "Please try again.",
        });
      } else {
        // Use the returned URL directly to avoid undefined
        if (result.avatarUrl) {
          setPreviewUrl(result.avatarUrl);
          // Update the avatar in the context so it updates everywhere
          updateAvatarUrl(result.avatarUrl);
        }

        toast.success("Avatar updated successfully");

        // Reset states
        setShowSaveButton(false);
        setSelectedFile(null);
        reset();

        // Refresh the router to update serverside components
        router.refresh();
      }
    });
  };

  return (
    <form>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative size-24 overflow-hidden rounded-full border-2 border-border shrink-0 ring-2 ring-background">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={t("label")}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted/50">
              <Icons.user className="size-12 text-muted-foreground" />
            </div>
          )}
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-full">
              <LoadingSpinner size="sm" variant="primary" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 flex-1 min-w-0 w-full sm:w-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => fileInputRef.current?.click()}
            >
              {t("title")}
            </Button>

            {showSaveButton && (
              <Button
                type="button"
                size="sm"
                className="h-9"
                onClick={handleAvatarUpload}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <LoadingSpinner size="sm" variant="primary" />
                    <span>Saving...</span>
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            )}
          </div>

          <input
            type="file"
            id="avatar"
            accept="image/jpeg, image/png, image/gif, image/webp"
            className="hidden"
            onChange={handleFileChange}
            ref={setRefs}
            {...rest}
          />

          {errors?.avatar && (
            <p className="text-xs text-destructive font-medium">
              {String(errors.avatar.message || "Invalid file")}
            </p>
          )}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("recommendation")}
          </p>
        </div>
      </div>
    </form>
  );
}
