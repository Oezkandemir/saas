import { NextRequest, NextResponse } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const resolvedParams = await params;
  const { locale } = resolvedParams;
  setRequestLocale(locale);

  // Get translated app name
  const t = await getTranslations("Meta");

  const manifest = {
    name: t("appName"),
    short_name: t("shortName"),
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
    theme_color: "#ffffff",
    background_color: "#ffffff",
    display: "standalone",
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
