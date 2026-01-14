import { Metadata } from "next";
import { Check } from "lucide-react";

import { constructMetadata } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = constructMetadata({
  title: "Enterprise Solutions",
  description: "Enterprise-grade solutions for your business",
});

export default async function EnterprisePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Enterprise Solutions</h1>
        <p className="text-xl text-muted-foreground">
          Powerful, scalable solutions for enterprise businesses
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Why Choose Cenety Enterprise?
        </h2>
        <p>
          Our enterprise solutions provide the reliability, security, and
          scalability that businesses need to succeed in today&apos;s fast-paced
          digital landscape. With dedicated support, custom development options,
          and advanced features, Cenety Enterprise helps your organization build
          better software faster.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Dedicated Support</CardTitle>
            <CardDescription>
              24/7 priority access to our support team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="mr-2 size-4 text-primary" />
                <span>Dedicated account manager</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 size-4 text-primary" />
                <span>Priority response times</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 size-4 text-primary" />
                <span>Technical consultation</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Development</CardTitle>
            <CardDescription>Tailored solutions for your needs</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="mr-2 size-4 text-primary" />
                <span>Custom integrations</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 size-4 text-primary" />
                <span>Bespoke feature development</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 size-4 text-primary" />
                <span>Migration assistance</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Security</CardTitle>
            <CardDescription>
              Enterprise-grade security features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Check className="mr-2 size-4 text-primary" />
                <span>Advanced encryption</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 size-4 text-primary" />
                <span>Compliance certification</span>
              </li>
              <li className="flex items-center">
                <Check className="mr-2 size-4 text-primary" />
                <span>Regular security audits</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg bg-muted p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold">Ready to get started?</h2>
        <p className="mb-6">
          Contact our sales team to discuss your enterprise requirements and how
          we can help.
        </p>
        <Button size="lg">Contact Sales</Button>
      </div>
    </div>
  );
}
