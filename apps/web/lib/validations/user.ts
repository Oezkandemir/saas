import * as z from "zod";

export const userNameSchema = z.object({
  name: z.string().min(3).max(32),
});

export const userRoleSchema = z.object({
  role: z.enum(["ADMIN", "USER"]),
});

export const userAvatarSchema = z.object({
  avatar: z
    .any()
    .refine((file) => file instanceof File, {
      message: "Avatar must be a file",
    })
    .refine((file) => file instanceof File && file.size <= 5 * 1024 * 1024, {
      message: "File size must be less than 5MB",
    })
    .refine(
      (file) =>
        file instanceof File &&
        ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(
          file.type,
        ),
      {
        message:
          "Unsupported file type. Please upload a JPEG, PNG, GIF, or WEBP image",
      },
    ),
});
