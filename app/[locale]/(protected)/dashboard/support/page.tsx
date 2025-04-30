import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeaderWithLanguageSwitcher } from "@/components/dashboard/header-with-language-switcher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Mail, MessageSquare, Phone } from "lucide-react";

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

  return (
    <>
      <DashboardHeaderWithLanguageSwitcher
        heading={t("heading")}
        text={t("text")}
      />

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("contactUs")}</CardTitle>
            <CardDescription>
              {t("contactDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("formFields.name")}</Label>
                <Input id="name" defaultValue={user?.name || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{t("formFields.email")}</Label>
                <Input id="email" type="email" defaultValue={user?.email || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject">{t("formFields.subject")}</Label>
                <Input id="subject" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">{t("formFields.message")}</Label>
                <Textarea id="message" rows={5} placeholder={t("formFields.messagePlaceholder")} />
              </div>
              <Button type="submit" className="w-full">
                {t("formFields.sendMessage")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>{t("supportChannels.title")}</CardTitle>
              <CardDescription>
                {t("supportChannels.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-3">
                <Mail className="size-5 text-primary" />
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
                <MessageSquare className="size-5 text-primary" />
                <div>
                  <p className="font-medium">{t("supportChannels.chat.title")}</p>
                  <p className="text-sm text-muted-foreground">{t("supportChannels.chat.availability")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="size-5 text-primary" />
                <div>
                  <p className="font-medium">{t("supportChannels.phone.title")}</p>
                  <p className="text-sm text-muted-foreground">{t("supportChannels.phone.number")}</p>
                  <p className="text-xs text-muted-foreground">{t("supportChannels.phone.restriction")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
        </div>
      </div>
    </>
  );
} 