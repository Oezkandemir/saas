import { Metadata } from "next";
import { AlertCircle, CheckCircle, Lock, Shield } from "lucide-react";

import { constructMetadata } from "@/lib/utils";

export const metadata: Metadata = constructMetadata({
  title: "Security",
  description: "How we keep your data secure at Cenety",
});

export default async function SecurityPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Security at Cenety</h1>
        <p className="text-xl text-muted-foreground">
          Your security and privacy are our top priorities
        </p>
      </div>

      <div className="space-y-4">
        <p>
          At Cenety, we understand that the security of your data is critical.
          We&apos;ve built our platform with security in mind at every step,
          implementing industry best practices and continuously monitoring for
          threats.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="size-8 text-primary" />
            <h2 className="text-2xl font-semibold">Infrastructure Security</h2>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-1 size-5 shrink-0 text-primary" />
              <span>
                All data is encrypted at rest and in transit using
                industry-standard encryption
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-1 size-5 shrink-0 text-primary" />
              <span>
                Hosted on secure cloud infrastructure with multiple redundancy
                layers
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-1 size-5 shrink-0 text-primary" />
              <span>
                Regular security audits and penetration testing by third-party
                specialists
              </span>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Lock className="size-8 text-primary" />
            <h2 className="text-2xl font-semibold">Account Security</h2>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-1 size-5 shrink-0 text-primary" />
              <span>
                Multi-factor authentication (MFA) to protect your account
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-1 size-5 shrink-0 text-primary" />
              <span>Role-based access controls for team management</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-1 size-5 shrink-0 text-primary" />
              <span>
                Session management with automatic timeouts for inactive sessions
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-1 size-6 text-primary" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Reporting Security Issues</h3>
            <p>
              We take security issues seriously. If you discover a potential
              security vulnerability, please report it responsibly by emailing
              our security team at security@cenety.com.
            </p>
            <p>
              Our security team will acknowledge your report within 24 hours and
              work with you to understand and address the issue quickly.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Compliance and Certifications
        </h2>
        <p>
          Cenety is committed to meeting industry standards and regulatory
          requirements to ensure your data is protected:
        </p>
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-1 size-5 shrink-0 text-primary" />
            <span>GDPR compliant</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-1 size-5 shrink-0 text-primary" />
            <span>SOC 2 Type II certified</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-1 size-5 shrink-0 text-primary" />
            <span>ISO 27001 certified</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
