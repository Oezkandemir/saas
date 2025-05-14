import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
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
                Were excited to have you join our community. Youll now receive
                updates on our latest features, tips, and exclusive content.
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
                Youre receiving this email because you signed up for the{" "}
                {siteName} newsletter.
              </Text>
              <Text>
                If you didnt sign up for this newsletter, you can safely ignore
                this email.
              </Text>
            </Section>
            <Hr className="my-6 border-gray-300" />
            <Text className="text-center text-xs text-gray-500">
              © {new Date().getFullYear()} {siteName}. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
