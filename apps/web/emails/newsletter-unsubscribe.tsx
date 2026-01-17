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

type NewsletterUnsubscribeEmailProps = {
  email: string;
  siteName: string;
  siteUrl: string;
};

export default function NewsletterUnsubscribeEmail({
  email: _email = "user@example.com",
  siteName = "Next.js SaaS Starter",
  siteUrl = "https://example.com",
}: NewsletterUnsubscribeEmailProps) {
  const previewText = `You have been unsubscribed from the ${siteName} newsletter`;

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
                You have been unsubscribed from our newsletter
              </Text>
              <Text className="text-gray-600">
                We&apos;re sorry to see you go. You will no longer receive our
                newsletter emails.
              </Text>
            </Section>
            <Section className="mt-8">
              <Text className="text-gray-600">
                If you unsubscribed by mistake or would like to resubscribe in
                the future, you can do so at any time.
              </Text>
              <Button
                className="mt-4 rounded bg-black px-6 py-3 text-center text-sm font-medium text-white"
                href={`${siteUrl}/newsletter`}
              >
                Resubscribe
              </Button>
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
