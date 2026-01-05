import Link from "next/link";
import { AlertTriangle, BanIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { Button } from '@/components/alignui/actions/button';
import { UserAvatar } from "@/components/shared/user-avatar";

export const dynamic = "force-dynamic";

export default async function BannedPage() {
  const t = await getTranslations("Banned");

  // Get current user info
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user data from database
  let dbName = null;
  if (user?.id) {
    const { data: dbUser } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();

    if (dbUser) {
      dbName = dbUser.name;
    }
  }

  // User name with fallback, prioritizing database name
  const userName =
    dbName ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    t("user", { defaultValue: "User" });
  const userAvatar = user?.user_metadata?.avatar_url;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
          <BanIcon className="size-10 text-red-600 dark:text-red-300" />
        </div>

        {user && (
          <div className="flex flex-col items-center gap-2">
            <UserAvatar
              user={{
                name: userName,
                avatar_url: userAvatar,
              }}
              className="size-16"
            />
            <p className="font-medium">{userName}</p>
          </div>
        )}

        <h1 className="text-2xl font-bold tracking-tight md:text-4xl">
          {t("heading", { defaultValue: "Account Suspended" })}
        </h1>

        <div className="flex items-center justify-center space-x-2 rounded-lg bg-amber-100 p-4 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          <AlertTriangle className="size-5" />
          <p className="text-sm font-medium">
            {t("message", {
              defaultValue:
                "Your account has been suspended due to a violation of our terms of service.",
            })}
          </p>
        </div>

        <p className="mx-auto max-w-xs text-center text-sm text-muted-foreground md:text-base">
          {t("contact", {
            defaultValue:
              "If you believe this is a mistake, please contact our support team.",
          })}
        </p>

        <div className="mt-4 flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
          <Link href="/">
            <Button variant="outline">
              {t("goHome", { defaultValue: "Return to Home" })}
            </Button>
          </Link>

          <Link href="/contact">
            <Button>
              {t("contactSupport", { defaultValue: "Contact Support" })}
            </Button>
          </Link>
        </div>

        {/* Sign out link */}
        <div className="pt-4">
          <Link
            href="/api/auth/signout"
            className="text-sm text-muted-foreground underline hover:text-primary"
          >
            {t("signOut", { defaultValue: "Sign out" })}
          </Link>
        </div>
      </div>
    </div>
  );
}
