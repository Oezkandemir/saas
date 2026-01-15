"use client";

import { FileText, Mail } from "lucide-react";
import { useState } from "react";
import type {
  EmailTemplate,
  ResendConfigStatus,
} from "@/actions/admin-email-actions";
import { EmailTemplates } from "@/components/admin/email-templates";
import { InboundEmailsList } from "@/components/admin/inbound-emails/inbound-emails-list";
import { InboundEmailsStats } from "@/components/admin/inbound-emails/inbound-emails-stats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type EmailsTabsProps = {
  templates: EmailTemplate[];
  configStatus: ResendConfigStatus;
};

export function EmailsTabs({ templates, configStatus }: EmailsTabsProps) {
  const [activeTab, setActiveTab] = useState("templates");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="templates" className="flex items-center gap-2">
          <FileText className="size-4" />
          E-Mail-Templates
        </TabsTrigger>
        <TabsTrigger value="inbound" className="flex items-center gap-2">
          <Mail className="size-4" />
          Eingehende Emails
        </TabsTrigger>
      </TabsList>

      <TabsContent value="templates" className="space-y-6">
        <EmailTemplates templates={templates} configStatus={configStatus} />
      </TabsContent>

      <TabsContent value="inbound" className="space-y-6">
        <InboundEmailsStats />
        <InboundEmailsList />
      </TabsContent>
    </Tabs>
  );
}
