import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default function RootPage() {
  // Redirect to default locale
  // The middleware should handle this, but this is a fallback
  redirect(`/${routing.defaultLocale}`);
}
