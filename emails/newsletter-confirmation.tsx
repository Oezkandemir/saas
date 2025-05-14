import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

type NewsletterConfirmationEmailProps = {
  email: string;
  siteName: string;
  siteUrl: string;
};

export default function NewsletterConfirmationEmail({
  email = "user@example.com",
  siteName = "Next.js SaaS Starter",
  siteUrl = "https://example.com",
}: NewsletterConfirmationEmailProps) {
  const previewText = `Thank you for subscribing to the ${siteName} newsletter!`;
  // Create a base64 token from the email for unsubscribe verification
  const unsubscribeToken = Buffer.from(email).toString("base64");
  const unsubscribeUrl = `${siteUrl}/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto my-10 max-w-[500px] rounded border border-solid border-gray-200 p-5">
            <Section className="mt-4">
              <Text className="text-center text-2xl font-bold">{siteName}</Text>
            </Section>
            <Section className="mt-8">
              <Text className="text-lg">
                Thank you for subscribing to our newsletter!
              </Text>
              <Text className="text-gray-600">
                We&apos;re excited to have you join our community. You&apos;ll
                now receive updates on our latest features, tips, and exclusive
                content.
              </Text>
            </Section>
            <Section className="mt-8">
              <Button
                className="rounded bg-black px-6 py-3 text-center text-sm font-medium text-white"
                href={siteUrl}
              >
                Visit our website
              </Button>
            </Section>
            <Section className="mt-8 text-sm text-gray-500">
              <Text>
                You&apos;re receiving this email because you signed up for the{" "}
                {siteName} newsletter.
              </Text>
              <Text>
                If you didn&apos;t sign up for this newsletter, you can safely
                ignore this email.
              </Text>
            </Section>
            <Hr className="my-6 border-gray-300" />
            <Text className="text-center text-xs text-gray-500">
              © {new Date().getFullYear()} {siteName}. All rights reserved.
            </Text>
            <Text className="text-center text-xs text-gray-400">
              <Link href={unsubscribeUrl} className="text-gray-400 underline">
                Unsubscribe from newsletter
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
