import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeaderWithLanguageSwitcher } from "@/components/dashboard/header-with-language-switcher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getUserTickets } from "@/actions/support-ticket-actions";
import { UserTicketAccordion } from "@/components/support/user-ticket-accordion";

export async function generateMetadata() {
  const t = await getTranslations("Support");
  
  return constructMetadata({
    title: t("title"),
    description: t("description"),
  });
}

export default async function SupportPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Support");

  // Fetch user tickets
  const ticketsResult = await getUserTickets();
  const tickets = ticketsResult.success ? ticketsResult.data || [] : [];

  return (
    <>
      <DashboardHeaderWithLanguageSwitcher
        heading={t("heading")}
        text={t("text")}
      />

      <Tabs defaultValue="tickets" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="tickets">My Tickets</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <Link href="/dashboard/support/new">
            <Button size="sm">
              <Plus className="mr-2 size-4" />
              New Ticket
            </Button>
          </Link>
        </div>

        <TabsContent value="tickets" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>
                View and manage your support tickets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="mb-4 text-center text-muted-foreground">
                    You dont have any support tickets yet.
                  </p>
                  <Link href="/dashboard/support/new">
                    <Button>
                      <Plus className="mr-2 size-4" />
                      Create your first ticket
                    </Button>
                  </Link>
                </div>
              ) : (
                <UserTicketAccordion data={tickets} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("contactUs")}</CardTitle>
              <CardDescription>
                {t("contactDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{t("supportChannels.email.title")}</p>
                    <p className="text-sm text-muted-foreground">
                      <a href={`mailto:${siteConfig.mailSupport}`} className="hover:underline">
                        {siteConfig.mailSupport}
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{t("supportChannels.chat.title")}</p>
                    <p className="text-sm text-muted-foreground">{t("supportChannels.chat.availability")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{t("supportChannels.phone.title")}</p>
                    <p className="text-sm text-muted-foreground">{t("supportChannels.phone.number")}</p>
                    <p className="text-xs text-muted-foreground">{t("supportChannels.phone.restriction")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("faq.title")}</CardTitle>
              <CardDescription>
                {t("faq.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Tabs defaultValue="billing" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="billing">{t("faq.categories.billing")}</TabsTrigger>
                  <TabsTrigger value="account">{t("faq.categories.account")}</TabsTrigger>
                  <TabsTrigger value="features">{t("faq.categories.features")}</TabsTrigger>
                </TabsList>
                <TabsContent value="billing" className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium">{t("faq.questions.billing.upgrade.question")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("faq.questions.billing.upgrade.answer")}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium">{t("faq.questions.billing.cancel.question")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("faq.questions.billing.cancel.answer")}
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="account" className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium">{t("faq.questions.account.resetPassword.question")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("faq.questions.account.resetPassword.answer")}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium">{t("faq.questions.account.updateProfile.question")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("faq.questions.account.updateProfile.answer")}
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="features" className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium">{t("faq.questions.features.included.question")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("faq.questions.features.included.answer")}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium">{t("faq.questions.features.api.question")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("faq.questions.features.api.answer")}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
} 