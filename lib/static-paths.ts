/**
 * Helper utilities for working with static assets in a Next.js app with i18n
 */

// Function to get a blog image path without locale issues
export const getBlogImagePath = (filename: string): string => {
  // Ensure the path starts with /_static/blog/
  if (filename.startsWith('/_static/blog/')) {
    return filename;
  }
  
  // If it's just the filename, add the path
  return `/_static/blog/${filename}`;
};

// Function to get an illustration path without locale issues
export const getIllustrationPath = (filename: string): string => {
  // Ensure the path starts with /_static/illustrations/
  if (filename.startsWith('/_static/illustrations/')) {
    return filename;
  }
  
  // If it's just the filename, add the path
  return `/_static/illustrations/${filename}`;
};

// Function to get an avatar path without locale issues
export const getAvatarPath = (filename: string): string => {
  // Ensure the path starts with /_static/avatars/
  if (filename.startsWith('/_static/avatars/')) {
    return filename;
  }
  
  // If it's just the filename, add the path
  return `/_static/avatars/${filename}`;
};

// General function to build paths for any static asset
export const getStaticPath = (subdir: string, filename: string): string => {
  // Create a full path from a subdirectory and filename
  const path = `/_static/${subdir}/${filename}`;
  return path;
}; 