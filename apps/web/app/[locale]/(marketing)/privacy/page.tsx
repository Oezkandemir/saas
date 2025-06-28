import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { constructMetadata } from "@/lib/utils";

export const metadata: Metadata = constructMetadata({
  title: "Privacy Policy",
  description: "Cenety Privacy Policy",
});

export default async function PrivacyPage() {
  const t = await getTranslations("Footer");

  return (
    <div className="container max-w-4xl py-12">
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: June 1, 2023</p>

        <div className="space-y-6">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Introduction</h2>
            <p>
              At Cenety, we take your privacy seriously. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your
              information when you visit our website or use our services. Please
              read this policy carefully. By accessing or using our services,
              you acknowledge that you have read and understood this Privacy
              Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              2. Information We Collect
            </h2>
            <p>
              We may collect personal information that you voluntarily provide
              to us when you register for an account, express interest in
              obtaining information about our services, or otherwise contact us.
            </p>
            <p>
              <strong>Personal Information:</strong> This may include your name,
              email address, phone number, billing address, and payment
              information.
            </p>
            <p>
              <strong>Usage Data:</strong> We may also collect information about
              how the services are accessed and used. This data may include your
              computer&apos;s Internet Protocol address, browser type, browser
              version, pages visited, time and date of visit, time spent on
              those pages, and other diagnostic data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              3. How We Use Your Information
            </h2>
            <p>
              We may use the information we collect for various purposes,
              including:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Providing and maintaining our Services</li>
              <li>Notifying you about changes to our Services</li>
              <li>
                Allowing you to participate in interactive features when you
                choose to do so
              </li>
              <li>Providing customer support</li>
              <li>
                Gathering analysis or valuable information to improve our
                Services
              </li>
              <li>Monitoring the usage of our Services</li>
              <li>Detecting, preventing, and addressing technical issues</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              4. Disclosure of Your Information
            </h2>
            <p>We may share your information with:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Service Providers:</strong> Third-party vendors who
                provide services on our behalf
              </li>
              <li>
                <strong>Business Partners:</strong> Companies with whom we
                partner to offer certain products, services, or promotions
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law, such
                as to comply with a subpoena or similar legal process
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              5. Security of Your Information
            </h2>
            <p>
              We implement appropriate technical and organizational safeguards
              to protect the security of your personal information. However, no
              method of transmission over the Internet or electronic storage is
              100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              6. Your Data Protection Rights
            </h2>
            <p>
              Depending on your location, you may have certain rights regarding
              your personal information, such as:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                The right to access the personal information we hold about you
              </li>
              <li>
                The right to request correction of your personal information
              </li>
              <li>
                The right to request deletion of your personal information
              </li>
              <li>
                The right to restrict processing of your personal information
              </li>
              <li>The right to data portability</li>
              <li>
                The right to object to processing of your personal information
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">
              7. Changes to This Privacy Policy
            </h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the &quot;Last updated&quot; date at the top of this
              policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at privacy@cenety.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
