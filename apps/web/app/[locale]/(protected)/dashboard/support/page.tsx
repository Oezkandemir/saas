import Link from "next/link";
import { getUserTickets } from "@/actions/support-ticket-actions";
import { Plus, HelpCircle, Mail, MessageCircle, Phone, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { getCurrentUser } from "@/lib/session";
import { constructMetadata } from "@/lib/utils";
import { Button } from '@/components/alignui/actions/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { UserTicketAccordion } from "@/components/support/user-ticket-accordion";

export async function generateMetadata() {
  const t = await getTranslations("Support");

  return constructMetadata({
    title: "Support Center - Get Help & Submit Tickets | Professional Customer Support",
    description: "Access our comprehensive support center. Submit tickets, get instant help, browse FAQs, and connect with our expert support team. Fast response times guaranteed.",
  });
}

export default async function SupportPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Support");

  // Fetch user tickets
  const ticketsResult = await getUserTickets();
  const tickets = ticketsResult.success ? ticketsResult.data || [] : [];

  // Calculate ticket stats
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <UnifiedPageLayout
      title="Support Center"
      description="Get expert help when you need it. Our support team is here to assist you with any questions or issues."
      icon={<HelpCircle className="h-4 w-4 text-primary" />}
      actions={
        <Link href="/dashboard/support/new">
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            New Ticket
          </Button>
        </Link>
      }
      contentClassName="space-y-6"
    >
      {/* Quick Stats */}
      {tickets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card hover>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
              <div className="flex size-9 items-center justify-center rounded-md bg-muted/50 border border-border">
                <HelpCircle className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold mb-1">{openTickets}</div>
              <CardDescription className="text-xs">
                Awaiting response
              </CardDescription>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
              <div className="flex size-9 items-center justify-center rounded-md bg-muted/50 border border-border">
                <MessageCircle className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold mb-1">{inProgressTickets}</div>
              <CardDescription className="text-xs">
                Being handled
              </CardDescription>
            </CardContent>
          </Card>

          <Card hover>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
              <div className="flex size-9 items-center justify-center rounded-md bg-muted/50 border border-border">
                <MessageCircle className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold mb-1">{resolvedTickets}</div>
              <CardDescription className="text-xs">
                Successfully closed
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="tickets" className="w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="tickets" className="flex-1 sm:flex-none">My Tickets</TabsTrigger>
            <TabsTrigger value="contact" className="flex-1 sm:flex-none">Contact</TabsTrigger>
            <TabsTrigger value="faq" className="flex-1 sm:flex-none">FAQ</TabsTrigger>
          </TabsList>

          <Link href="/dashboard/support/new" className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto gap-2">
              <Plus className="size-4" />
              New Ticket
            </Button>
          </Link>
        </div>

        <TabsContent value="tickets" className="py-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-muted/50 border border-border">
                  <HelpCircle className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>Your Support Tickets</CardTitle>
                  <CardDescription>
                    Track all your support requests in one place. Average response time: 2-4 hours.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="flex size-16 items-center justify-center rounded-lg bg-muted/50 border border-border mb-6">
                    <HelpCircle className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">No Support Tickets Yet</h3>
                  <p className="mb-4 text-center text-sm text-muted-foreground max-w-md">
                    Need help? Our support team is ready to assist you. Create your first ticket and we'll respond within 2-4 hours.
                  </p>
                  <Link href="/dashboard/support/new">
                    <Button className="gap-2">
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
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-muted/50 border border-border">
                  <Mail className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>Get in Touch</CardTitle>
                  <CardDescription>Multiple ways to reach our support team - choose what works best for you.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="group relative flex items-center gap-4 rounded-lg border border-border p-4 transition-all hover:bg-muted/50">
                  <div className="flex size-10 items-center justify-center rounded-md bg-muted/50 border border-border">
                    <Mail className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">
                      Email Support
                    </p>
                    <a
                      href={`mailto:${siteConfig.mailSupport}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group-hover:gap-2"
                    >
                      {siteConfig.mailSupport}
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">
                      Response within 24 hours
                    </p>
                  </div>
                </div>
                <div className="group relative flex items-center gap-4 rounded-lg border border-border p-4 transition-all hover:bg-muted/50">
                  <div className="flex size-10 items-center justify-center rounded-md bg-muted/50 border border-border">
                    <MessageCircle className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">
                      Live Chat Support
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Available Mon-Fri, 9am-6pm
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Instant responses for urgent issues
                    </p>
                  </div>
                </div>
                <div className="group relative flex items-center gap-4 rounded-lg border border-border p-4 transition-all hover:bg-muted/50">
                  <div className="flex size-10 items-center justify-center rounded-md bg-muted/50 border border-border">
                    <Phone className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">
                      Phone Support
                    </p>
                    <p className="text-sm text-muted-foreground">
                      +1 (555) 123-4567
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Premium plan subscribers only
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="py-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-muted/50 border border-border">
                  <HelpCircle className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>Find quick answers to common questions - browse our knowledge base.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Tabs defaultValue="billing" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="billing">
                    Billing & Plans
                  </TabsTrigger>
                  <TabsTrigger value="account">
                    Account Settings
                  </TabsTrigger>
                  <TabsTrigger value="features">
                    Features & Usage
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="billing" className="mt-4 space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">
                      How do I upgrade my subscription plan?
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Navigate to Settings → Billing, select your desired plan, and complete the payment process. Your upgrade takes effect immediately, and you'll have access to all premium features right away. No downtime required.
                    </p>
                  </div>
                  <Separator />
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">
                      Can I cancel my subscription anytime?
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Yes, you can cancel anytime without penalties. Your subscription remains active until the end of your billing period. Go to Settings → Billing → Manage Subscription to cancel. All your data is preserved for 30 days after cancellation.
                    </p>
                  </div>
                  <Separator />
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">
                      What payment methods do you accept?
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for enterprise plans. All payments are processed securely through Stripe.
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="account" className="mt-4 space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">
                      How do I reset my password?
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Click "Forgot Password" on the login page, enter your email address, and follow the instructions sent to your inbox. Password reset links expire after 1 hour for security reasons.
                    </p>
                  </div>
                  <Separator />
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">
                      How do I update my profile information?
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Go to Settings → Profile to update your name, email, avatar, and other personal details. Changes are saved automatically and sync across all your devices instantly.
                    </p>
                  </div>
                  <Separator />
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">
                      Can I use the same account on multiple devices?
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Yes! Your account works seamlessly across all devices. Log in from your computer, tablet, or phone - your data stays synced in real-time across all platforms.
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="features" className="mt-4 space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">
                      What features are included in my plan?
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Each plan includes document management, QR code generation, customer tracking, and analytics. Premium plans add unlimited storage, priority support, API access, and advanced customization options. Check our pricing page for detailed comparisons.
                    </p>
                  </div>
                  <Separator />
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">
                      Do you offer API access?
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Yes, API access is available on Business and Enterprise plans. Our REST API includes comprehensive documentation, SDKs for popular languages, and webhook support for real-time integrations. Rate limits vary by plan.
                    </p>
                  </div>
                  <Separator />
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">
                      Is there a mobile app available?
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Our platform is fully responsive and works beautifully on mobile browsers. Native iOS and Android apps are currently in development and will be launched in Q2 2025 with offline capabilities.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </UnifiedPageLayout>
  );
}

