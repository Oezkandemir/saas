import Link from "next/link";
import { getUserTickets } from "@/actions/support-ticket-actions";
import { Plus, HelpCircle, Mail, MessageCircle, Phone, ArrowRight } from "lucide-react";
import { getLocale, setRequestLocale } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { constructMetadata } from "@/lib/utils";
import { Button } from '@/components/alignui/actions/button';
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { UserTicketAccordion } from "@/components/support/user-ticket-accordion";

export async function generateMetadata() {
  // CRITICAL FIX: Get locale and set it before translations
  // This ensures correct language during client-side navigation
  const locale = await getLocale();
  setRequestLocale(locale);

  return constructMetadata({
    title: "Support Center - Get Help & Submit Tickets | Professional Customer Support",
    description: "Access our comprehensive support center. Submit tickets, get instant help, browse FAQs, and connect with our expert support team. Fast response times guaranteed.",
  });
}

export default async function SupportPage() {
  // Fetch user tickets
  const ticketsResult = await getUserTickets();
  const tickets = ticketsResult.success ? ticketsResult.data || [] : [];

  // Calculate ticket stats
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;

  // Contextual description with ticket counts
  const description = tickets.length > 0 
    ? `${tickets.length} tickets • ${openTickets} open • ${inProgressTickets} in progress`
    : "Get expert help when you need it. Our support team is here to assist you with any questions or issues.";

  return (
    <UnifiedPageLayout
      title="Support Center"
      description={description}
      icon={<HelpCircle className="h-4 w-4 text-primary" />}
      actions={
        <Link href="/dashboard/support/new">
          <Button size="sm" className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Ticket</span>
            <span className="sm:hidden">New</span>
          </Button>
        </Link>
      }
      contentClassName=""
    >
      <Tabs defaultValue="tickets" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="tickets" className="flex-1 sm:flex-none">My Tickets</TabsTrigger>
          <TabsTrigger value="contact" className="flex-1 sm:flex-none">Contact</TabsTrigger>
          <TabsTrigger value="faq" className="flex-1 sm:flex-none">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-6">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted/50 border border-border mb-3">
                <HelpCircle className="size-6 text-muted-foreground" />
              </div>
              <h3 className="mb-1 text-base font-semibold">No Support Tickets Yet</h3>
              <p className="mb-6 text-center text-sm text-muted-foreground max-w-md">
                Need help? Our support team is ready to assist you. Create your first ticket and we'll respond within 2-4 hours.
              </p>
              <Link href="/dashboard/support/new">
                <Button size="sm" className="gap-2">
                  <Plus className="size-4" />
                  Create your first ticket
                </Button>
              </Link>
            </div>
          ) : (
            <UserTicketAccordion data={tickets} />
          )}
        </TabsContent>

        <TabsContent value="contact" className="mt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4 rounded-lg border border-border p-4">
              <div className="flex size-10 items-center justify-center rounded-md bg-muted/50 border border-border shrink-0">
                <Mail className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm mb-1">Email Support</p>
                <a
                  href={`mailto:${siteConfig.mailSupport}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  {siteConfig.mailSupport}
                  <ArrowRight className="size-3" />
                </a>
                <p className="text-xs text-muted-foreground mt-1">
                  Response within 24 hours
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg border border-border p-4">
              <div className="flex size-10 items-center justify-center rounded-md bg-muted/50 border border-border shrink-0">
                <MessageCircle className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm mb-1">Live Chat Support</p>
                <p className="text-sm text-muted-foreground">
                  Available Mon-Fri, 9am-6pm
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Instant responses for urgent issues
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-lg border border-border p-4">
              <div className="flex size-10 items-center justify-center rounded-md bg-muted/50 border border-border shrink-0">
                <Phone className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm mb-1">Phone Support</p>
                <p className="text-sm text-muted-foreground">
                  +1 (555) 123-4567
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Premium plan subscribers only
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="faq" className="mt-6">
          <Tabs defaultValue="billing" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="billing">Billing & Plans</TabsTrigger>
              <TabsTrigger value="account">Account Settings</TabsTrigger>
              <TabsTrigger value="features">Features & Usage</TabsTrigger>
            </TabsList>
            <TabsContent value="billing" className="mt-4 space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2 text-sm">
                  How do I upgrade my subscription plan?
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Navigate to Settings → Billing, select your desired plan, and complete the payment process. Your upgrade takes effect immediately, and you'll have access to all premium features right away. No downtime required.
                </p>
              </div>
              <Separator />
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2 text-sm">
                  Can I cancel my subscription anytime?
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Yes, you can cancel anytime without penalties. Your subscription remains active until the end of your billing period. Go to Settings → Billing → Manage Subscription to cancel. All your data is preserved for 30 days after cancellation.
                </p>
              </div>
              <Separator />
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2 text-sm">
                  What payment methods do you accept?
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for enterprise plans. All payments are processed securely through Stripe.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="account" className="mt-4 space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2 text-sm">
                  How do I reset my password?
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Click "Forgot Password" on the login page, enter your email address, and follow the instructions sent to your inbox. Password reset links expire after 1 hour for security reasons.
                </p>
              </div>
              <Separator />
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2 text-sm">
                  How do I update my profile information?
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Go to Settings → Profile to update your name, email, avatar, and other personal details. Changes are saved automatically and sync across all your devices instantly.
                </p>
              </div>
              <Separator />
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2 text-sm">
                  Can I use the same account on multiple devices?
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Yes! Your account works seamlessly across all devices. Log in from your computer, tablet, or phone - your data stays synced in real-time across all platforms.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="features" className="mt-4 space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2 text-sm">
                  What features are included in my plan?
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Each plan includes document management, QR code generation, customer tracking, and analytics. Premium plans add unlimited storage, priority support, API access, and advanced customization options. Check our pricing page for detailed comparisons.
                </p>
              </div>
              <Separator />
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2 text-sm">
                  Do you offer API access?
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Yes, API access is available on Business and Enterprise plans. Our REST API includes comprehensive documentation, SDKs for popular languages, and webhook support for real-time integrations. Rate limits vary by plan.
                </p>
              </div>
              <Separator />
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2 text-sm">
                  Is there a mobile app available?
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our platform is fully responsive and works beautifully on mobile browsers. Native iOS and Android apps are currently in development and will be launched in Q2 2025 with offline capabilities.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </UnifiedPageLayout>
  );
}

