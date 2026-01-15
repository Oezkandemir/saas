import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./ui/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}",
  ],
  safelist: [
    {
      pattern:
        /^(border-subtle|shadow-subtle|transition-subtle|transition-smooth|hover-lift|hover-scale)/,
    },
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem", // 16px - Mobile
        sm: "1.5rem", // 24px - Tablet
        md: "2rem", // 32px - Desktop
        lg: "2rem", // 32px - Large Desktop
        xl: "2rem", // 32px - XL Desktop (konsistent mit 8px Grid)
      },
    },
    extend: {
      fontSize: {
        // Typography System - Klare Hierarchie (2 Fonts max)
        // Caption & Small Text
        xs: ["0.75rem", { lineHeight: "1.5", letterSpacing: "0" }], // 12px - Caption
        sm: ["0.875rem", { lineHeight: "1.5", letterSpacing: "0" }], // 14px - Small Body

        // Body Text
        base: ["1rem", { lineHeight: "1.6", letterSpacing: "0" }], // 16px - Body

        // Headings
        lg: ["1.125rem", { lineHeight: "1.4", letterSpacing: "-0.01em" }], // 18px - H4
        xl: ["1.25rem", { lineHeight: "1.4", letterSpacing: "-0.01em" }], // 20px - H3
        "2xl": ["1.5rem", { lineHeight: "1.3", letterSpacing: "-0.02em" }], // 24px - H2
        "3xl": ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }], // 30px - H1
        "4xl": ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }], // 36px - Display
        "5xl": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }], // 48px - Large Display
      },
      spacing: {
        // 8px Grid System - Konsistente Spacing-Werte
        // Basis: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
        "0.5": "0.125rem", // 2px (für sehr feine Abstände)
        "1": "0.25rem", // 4px
        "1.5": "0.375rem", // 6px
        "2": "0.5rem", // 8px - Basis-Einheit
        "2.5": "0.625rem", // 10px
        "3": "0.75rem", // 12px
        "3.5": "0.875rem", // 14px
        "4": "1rem", // 16px
        "5": "1.25rem", // 20px
        "6": "1.5rem", // 24px
        "7": "1.75rem", // 28px
        "8": "2rem", // 32px
        "9": "2.25rem", // 36px
        "10": "2.5rem", // 40px
        "12": "3rem", // 48px
        "16": "4rem", // 64px
        // Mobile Safe Area Insets
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Design System Colors
        "bg-white": {
          0: "hsl(var(--bg-white-0))",
          50: "hsl(var(--bg-white-50))",
          100: "hsl(var(--bg-white-100))",
        },
        "text-strong": {
          950: "hsl(var(--text-strong-950))",
          900: "hsl(var(--text-strong-900))",
        },
        "text-sub": {
          600: "hsl(var(--text-sub-600))",
          500: "hsl(var(--text-sub-500))",
        },
        "stroke-soft": {
          200: "hsl(var(--stroke-soft-200))",
          300: "hsl(var(--stroke-soft-300))",
          400: "hsl(var(--stroke-soft-400))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "20": "20px", // Custom rounded-20
      },
      fontFamily: {
        // Inter - Moderne, hochgradig lesbare Schrift für alle Texte
        // Body Font (Primary) - Inter Regular
        sans: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        // Heading Font - Inter Bold für Konsistenz
        heading: [
          "var(--font-heading)",
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        // Legacy Support (werden schrittweise entfernt)
        inter: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        urban: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        geist: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // Fade up and down
        "fade-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "80%": {
            opacity: "0.7",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0px)",
          },
        },
        "fade-down": {
          "0%": {
            opacity: "0",
            transform: "translateY(-10px)",
          },
          "80%": {
            opacity: "0.6",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0px)",
          },
        },
        // Fade in and out
        "fade-in": {
          "0%": {
            opacity: "0",
          },
          "50%": {
            opacity: "0.6",
          },
          "100%": {
            opacity: "1",
          },
        },
        "fade-out": {
          "0%": {
            opacity: "0",
          },
          "50%": {
            opacity: "0.6",
          },
          "100%": {
            opacity: "1",
          },
        },
        shimmer: {
          "0%": {
            backgroundPosition: "-1000px 0",
          },
          "100%": {
            backgroundPosition: "1000px 0",
          },
        },
        "slide-in-from-top": {
          "0%": {
            transform: "translateY(-100%)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        "slide-in-from-bottom": {
          "0%": {
            transform: "translateY(100%)",
            opacity: "0",
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        "slide-in-from-left": {
          "0%": {
            transform: "translateX(-100%)",
            opacity: "0",
          },
          "100%": {
            transform: "translateX(0)",
            opacity: "1",
          },
        },
        "slide-in-from-right": {
          "0%": {
            transform: "translateX(100%)",
            opacity: "0",
          },
          "100%": {
            transform: "translateX(0)",
            opacity: "1",
          },
        },
        "scale-in": {
          "0%": {
            transform: "scale(0.95)",
            opacity: "0",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
        "bounce-subtle": {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(-5px)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",

        // Fade up and down
        "fade-up": "fade-up 0.5s ease-out",
        "fade-down": "fade-down 0.5s ease-out",

        // Fade in and out
        "fade-in": "fade-in 0.4s ease-out",
        "fade-out": "fade-out 0.4s ease-out",

        // Shimmer effect
        shimmer: "shimmer 2s linear infinite",

        // Slide animations
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
        "slide-in-from-left": "slide-in-from-left 0.3s ease-out",
        "slide-in-from-right": "slide-in-from-right 0.3s ease-out",

        // Scale animations
        "scale-in": "scale-in 0.2s ease-out",

        // Bounce
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    // Custom utilities plugin
    ({ addUtilities }: any) => {
      addUtilities({
        ".border-subtle": {
          "border-color": "hsl(var(--border) / 0.5)",
        },
        ".shadow-subtle": {
          "box-shadow": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        },
        ".shadow-subtle-md": {
          "box-shadow":
            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        },
        ".shadow-subtle-lg": {
          "box-shadow":
            "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        },
        ".transition-subtle": {
          transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
        },
        ".transition-smooth": {
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        },
        ".transition-smooth-lg": {
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
        ".dark .shadow-subtle": {
          "box-shadow": "0 1px 2px 0 rgb(0 0 0 / 0.3)",
        },
        ".dark .shadow-subtle-md": {
          "box-shadow":
            "0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)",
        },
        ".dark .shadow-subtle-lg": {
          "box-shadow":
            "0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3)",
        },
        // Shadow Utilities
        ".shadow-regular-xs": {
          "box-shadow": "var(--shadow-regular-xs)",
        },
        ".shadow-regular-sm": {
          "box-shadow": "var(--shadow-regular-sm)",
        },
        ".shadow-regular-md": {
          "box-shadow": "var(--shadow-regular-md)",
        },
        ".shadow-regular-lg": {
          "box-shadow": "var(--shadow-regular-lg)",
        },
        // Alias for shadow-custom-md (used in Drawer)
        ".shadow-custom-md": {
          "box-shadow": "var(--shadow-regular-md)",
        },
      });
    },
  ],
} satisfies Config;

export default config;
