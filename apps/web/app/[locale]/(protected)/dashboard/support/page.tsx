import Link from "next/link";
import { getUserTickets } from "@/actions/support-ticket-actions";
import { Plus, HelpCircle, Mail, MessageCircle, Phone, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModernPageHeader } from "@/components/layout/modern-page-header";
import { UserTicketAccordion } from "@/components/support/user-ticket-accordion";
import { cn } from "@/lib/utils";

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
    <div className="relative flex flex-col gap-6">
      {/* Animated background decoration */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[400px] w-[400px] -translate-x-1/2 animate-pulse rounded-full bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-[300px] w-[300px] -translate-y-1/2 animate-pulse rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-3xl delay-1000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Header */}
      <ModernPageHeader
        title={t("heading")}
        description={t("text")}
        icon={<HelpCircle className="h-5 w-5 text-primary" />}
        actions={
          <Link href="/dashboard/support/new">
            <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
              <Plus className="size-4" />
              New Ticket
            </Button>
          </Link>
        }
      />

      <Tabs defaultValue="tickets" className="w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="w-full sm:w-auto bg-card/80 backdrop-blur-sm border border-border/50">
            <TabsTrigger value="tickets" className="flex-1 sm:flex-none">My Tickets</TabsTrigger>
            <TabsTrigger value="contact" className="flex-1 sm:flex-none">Contact</TabsTrigger>
            <TabsTrigger value="faq" className="flex-1 sm:flex-none">FAQ</TabsTrigger>
          </TabsList>

          <Link href="/dashboard/support/new" className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg transition-all hover:scale-105">
              <Plus className="size-4" />
              New Ticket
            </Button>
          </Link>
        </div>

        <TabsContent value="tickets" className="py-4">
          <Card className="relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm">
            {/* Gradient background */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />

            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 shadow-lg">
                  <HelpCircle className="size-5" />
                </div>
                <div>
                  <CardTitle>Support Tickets</CardTitle>
                  <CardDescription>
                    View and manage your support tickets.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 mb-6">
                    <HelpCircle className="size-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="mb-4 text-center text-muted-foreground font-medium">
                    You dont have any support tickets yet.
                  </p>
                  <Link href="/dashboard/support/new">
                    <Button className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg transition-all hover:scale-105">
                      <Plus className="size-4" />
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
          <Card className="relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm">
            {/* Gradient background */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />

            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 shadow-lg">
                  <Mail className="size-5" />
                </div>
                <div>
                  <CardTitle>{t("contactUs")}</CardTitle>
                  <CardDescription>{t("contactDescription")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="group relative flex items-center gap-4 rounded-lg border border-border/50 bg-background/50 p-4 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-background hover:shadow-md">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 shadow-lg">
                    <Mail className="size-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {t("supportChannels.email.title")}
                    </p>
                    <a
                      href={`mailto:${siteConfig.mailSupport}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group-hover:gap-2"
                    >
                      {siteConfig.mailSupport}
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                    </a>
                  </div>
                </div>
                <div className="group relative flex items-center gap-4 rounded-lg border border-border/50 bg-background/50 p-4 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-background hover:shadow-md">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 shadow-lg">
                    <MessageCircle className="size-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {t("supportChannels.chat.title")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("supportChannels.chat.availability")}
                    </p>
                  </div>
                </div>
                <div className="group relative flex items-center gap-4 rounded-lg border border-border/50 bg-background/50 p-4 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-background hover:shadow-md">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 text-orange-600 dark:text-orange-400 shadow-lg">
                    <Phone className="size-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">
                      {t("supportChannels.phone.title")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("supportChannels.phone.number")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("supportChannels.phone.restriction")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="py-4">
          <Card className="relative overflow-hidden border border-border/50 bg-card/80 backdrop-blur-sm">
            {/* Gradient background */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />

            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 shadow-lg">
                  <HelpCircle className="size-5" />
                </div>
                <div>
                  <CardTitle>{t("faq.title")}</CardTitle>
                  <CardDescription>{t("faq.description")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Tabs defaultValue="billing" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-card/80 backdrop-blur-sm border border-border/50">
                  <TabsTrigger value="billing">
                    {t("faq.categories.billing")}
                  </TabsTrigger>
                  <TabsTrigger value="account">
                    {t("faq.categories.account")}
                  </TabsTrigger>
                  <TabsTrigger value="features">
                    {t("faq.categories.features")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="billing" className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium">
                      {t("faq.questions.billing.upgrade.question")}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t("faq.questions.billing.upgrade.answer")}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium">
                      {t("faq.questions.billing.cancel.question")}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t("faq.questions.billing.cancel.answer")}
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="account" className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium">
                      {t("faq.questions.account.resetPassword.question")}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t("faq.questions.account.resetPassword.answer")}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium">
                      {t("faq.questions.account.updateProfile.question")}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t("faq.questions.account.updateProfile.answer")}
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="features" className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium">
                      {t("faq.questions.features.included.question")}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t("faq.questions.features.included.answer")}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium">
                      {t("faq.questions.features.api.question")}
                    </h4>
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
    </div>
  );
}

