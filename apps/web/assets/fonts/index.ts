// Use local fonts only to avoid Google Fonts fetch issues during build
import localFont from "next/font/local";

// System font fallback for sans-serif (replaces Inter from Google)
export const fontSans = localFont({
  src: [
    {
      path: "./GeistVF.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

// System font fallback for urban (replaces Urbanist from Google)
export const fontUrban = localFont({
  src: [
    {
      path: "./GeistVF.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-urban",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

export const fontHeading = localFont({
  src: "./CalSans-SemiBold.woff2",
  variable: "--font-heading",
  display: "swap",
});

export const fontGeist = localFont({
  src: "./GeistVF.woff2",
  variable: "--font-geist",
  display: "swap",
});
