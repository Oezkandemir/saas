import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

export default function RootPage() {
  // Default to the configured default locale
  // This will only happen at the root path "/"
  redirect(`/${routing.defaultLocale}`);
}
