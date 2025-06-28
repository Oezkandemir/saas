import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { DeleteAccountSection } from "@/components/dashboard/delete-account";
import { DashboardHeaderWithLanguageSwitcher } from "@/components/dashboard/header-with-language-switcher";
import { SectionColumns } from "@/components/dashboard/section-columns";
import { UserAvatarForm } from "@/components/forms/user-avatar-form";
import { UserNameForm } from "@/components/forms/user-name-form";
import { UserRoleForm } from "@/components/forms/user-role-form";

export async function generateMetadata() {
  const t = await getTranslations("Settings");

  return constructMetadata({
    title: t("title"),
    description: t("description"),
  });
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Settings");

  if (!user?.id) redirect("/login");

  // Ensure we have the necessary user information
  console.log("User data in settings page:", JSON.stringify(user, null, 2));

  return (
    <>
      <DashboardHeaderWithLanguageSwitcher
        heading={t("heading")}
        text={t("text")}
      />
      <div className="divide-y divide-muted pb-10">
        <UserAvatarForm
          user={{ id: user.id, avatar_url: user.user_metadata?.avatar_url }}
        />
        <UserNameForm user={{ id: user.id, name: user.name || "" }} />
        <UserRoleForm user={{ id: user.id, role: user.role || "USER" }} />

        <SectionColumns
          title={t("userInformation")}
          description={t("debugInformation")}
        >
          <div className="rounded-md bg-muted p-4">
            <pre className="overflow-auto text-xs">
              {JSON.stringify(
                {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  role: user.role,
                  metadata: user.user_metadata,
                },
                null,
                2,
              )}
            </pre>
          </div>
        </SectionColumns>

        <DeleteAccountSection />
      </div>
    </>
  );
}
