import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { constructMetadata } from "@/lib/utils";

export const metadata: Metadata = constructMetadata({
  title: "Terms of Service",
  description: "Cenety Terms of Service agreement",
});

export default async function TermsPage() {
  const t = await getTranslations("Footer");

  return (
    <div className="w-full py-12">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: June 1, 2023</p>

        <div className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Introduction</h2>
            <p>
              Welcome to Cenety. These Terms of Service (&quot;Terms&quot;)
              govern your use of the Cenety website, platform, and services
              (collectively, the &quot;Services&quot;). By accessing or using
              our Services, you agree to be bound by these Terms. If you
              disagree with any part of the Terms, you do not have permission to
              access the Services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Definitions</h2>
            <p>
              <strong>&quot;Account&quot;</strong> means a unique account
              created for you to access our Services.
            </p>
            <p>
              <strong>&quot;Content&quot;</strong> means any text, images,
              graphics, videos, or other material that you upload, post, or
              otherwise make available through the Services.
            </p>
            <p>
              <strong>&quot;User&quot;</strong> means any individual who
              accesses or uses the Services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Account Registration</h2>
            <p>
              To use certain features of the Services, you may be required to
              register for an Account. You agree to provide accurate, current,
              and complete information during the registration process and to
              update such information to keep it accurate, current, and
              complete.
            </p>
            <p>
              You are responsible for safeguarding the password that you use to
              access the Services and for any activities or actions under your
              Account. We encourage you to use a strong password and to sign out
              of your Account at the end of each session.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Intellectual Property</h2>
            <p>
              The Services and their original content, features, and
              functionality are owned by Cenety and are protected by
              international copyright, trademark, patent, trade secret, and
              other intellectual property laws.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. User Content</h2>
            <p>
              You retain all rights to any Content that you submit, post, or
              display on or through the Services. By submitting, posting, or
              displaying Content on or through the Services, you grant us a
              worldwide, non-exclusive, royalty-free license to use, copy,
              reproduce, process, adapt, modify, publish, transmit, display, and
              distribute such Content.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Termination</h2>
            <p>
              We reserve the right to terminate or suspend your Account and
              access to the Services, without prior notice or liability, for any
              reason whatsoever, including, without limitation, if you breach
              these Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              7. Limitation of Liability
            </h2>
            <p>
              In no event shall Cenety, its directors, employees, partners,
              agents, suppliers, or affiliates be liable for any indirect,
              incidental, special, consequential, or punitive damages, including
              without limitation, loss of profits, data, use, goodwill, or other
              intangible losses, resulting from your access to or use of or
              inability to access or use the Services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. If a revision is material, we will
              provide at least 30 days&apos; notice prior to any new terms
              taking effect. What constitutes a material change will be
              determined at our sole discretion.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at
              terms@cenety.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
