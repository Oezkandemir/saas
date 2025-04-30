import { Metadata } from "next";
import { constructMetadata } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { Paintbrush, Settings, Code, Puzzle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = constructMetadata({
  title: "Customization",
  description: "Customize Cenety to fit your unique needs",
});

export default async function CustomizationPage() {
  const t = await getTranslations("Footer");

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Customization</h1>
        <p className="text-xl text-muted-foreground">
          Tailor Cenety to match your brand and workflow
        </p>
      </div>

      <div className="space-y-4">
        <p>
          Cenety is designed to be highly customizable, allowing you to adapt the platform to your specific 
          requirements without compromise. From visual elements to core functionality, our flexible architecture 
          gives you the freedom to create a truly personalized experience.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Paintbrush className="size-8 text-primary" />
            <div>
              <CardTitle>Visual Customization</CardTitle>
              <CardDescription>Make Cenety your own</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Customize the look and feel of your Cenety implementation to match your brand identity:
            </p>
            <ul className="space-y-2">
              <li>• Custom color schemes and theming</li>
              <li>• Logo and branding elements</li>
              <li>• Typography customization</li>
              <li>• Light and dark mode support</li>
              <li>• Custom layouts and page designs</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Settings className="size-8 text-primary" />
            <div>
              <CardTitle>Functional Customization</CardTitle>
              <CardDescription>Adapt to your workflow</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Tailor the functionality to meet your specific business requirements:
            </p>
            <ul className="space-y-2">
              <li>• Custom user roles and permissions</li>
              <li>• Workflow automation</li>
              <li>• Form and field customization</li>
              <li>• Dashboard and reporting tools</li>
              <li>• Notification preferences</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Code className="size-8 text-primary" />
            <div>
              <CardTitle>Developer Extensibility</CardTitle>
              <CardDescription>Build with your preferred tools</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Extend Cenety with custom code and integrations:
            </p>
            <ul className="space-y-2">
              <li>• API access for custom functionality</li>
              <li>• Webhook support for event-driven architectures</li>
              <li>• Custom component development</li>
              <li>• Server-side extensions</li>
              <li>• Database schema extensions</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Puzzle className="size-8 text-primary" />
            <div>
              <CardTitle>Integration Capabilities</CardTitle>
              <CardDescription>Connect with your existing tools</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Seamlessly connect Cenety with your existing tools and services:
            </p>
            <ul className="space-y-2">
              <li>• Third-party service integrations</li>
              <li>• SSO and identity management</li>
              <li>• Analytics and monitoring tools</li>
              <li>• CRM and marketing platforms</li>
              <li>• Payment processors and billing systems</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg bg-muted p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold">Need help with customization?</h2>
        <p className="mb-6">
          Our team of experts can assist you with advanced customization needs or provide guidance
          on best practices for extending Cenety.
        </p>
        <div className="flex justify-center gap-4">
          <a href="#" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Contact Us
          </a>
          <a href="#" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium">
            View Documentation
          </a>
        </div>
      </div>
    </div>
  );
} 