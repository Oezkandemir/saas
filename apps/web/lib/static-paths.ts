/**
 * Helper utilities for working with static assets in a Next.js app with i18n
 */
import { resolveStaticPath } from "./utils";

// Function to get a blog image path without locale issues
export const getBlogImagePath = (filename: string): string => {
  // If it already has the full path structure, just ensure it's resolved correctly
  if (filename.startsWith("/_static/blog/") || filename.startsWith("/blog/")) {
    return resolveStaticPath(filename);
  }

  // If it's just the filename, add the blog path
  return resolveStaticPath(`blog/${filename}`);
};

// Function to get an illustration path without locale issues
export const getIllustrationPath = (filename: string): string => {
  // If it already has the full path structure, just ensure it's resolved correctly
  if (
    filename.startsWith("/_static/illustrations/") ||
    filename.startsWith("/illustrations/")
  ) {
    return resolveStaticPath(filename);
  }

  // If it's just the filename, add the illustrations path
  return resolveStaticPath(`illustrations/${filename}`);
};

// Function to get an avatar path without locale issues
export const getAvatarPath = (filename: string): string => {
  // If it already has the full path structure, just ensure it's resolved correctly
  if (
    filename.startsWith("/_static/avatars/") ||
    filename.startsWith("/avatars/")
  ) {
    return resolveStaticPath(filename);
  }

  // If it's just the filename, add the avatars path
  return resolveStaticPath(`avatars/${filename}`);
};

// General function to build paths for any static asset
export const getStaticPath = (subdir: string, filename: string): string => {
  // Create a path from a subdirectory and filename and resolve it
  return resolveStaticPath(`${subdir}/${filename}`);
};
