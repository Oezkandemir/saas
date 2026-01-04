// ⚡ MODERN, READABLE FONTS - Inter für optimale Lesbarkeit
import localFont from "next/font/local";

// Inter - Moderne, hochgradig lesbare Sans-Serif Schrift
// Optimiert für Bildschirmlesbarkeit mit exzellenter Lesbarkeit bei allen Größen
export const fontSans = localFont({
  src: [
    {
      path: "./Inter-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./Inter-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

// Inter für Headings - Gleiche Schriftfamilie für Konsistenz
// Verwendet Inter Bold für Headings statt separater Schriftart
export const fontHeading = localFont({
  src: [
    {
      path: "./Inter-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-heading",
  display: "swap",
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

// Legacy exports für Kompatibilität (werden nicht mehr verwendet)
export const fontInter = fontSans;
export const fontUrban = fontSans;
export const fontGeist = fontSans;
