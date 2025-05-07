import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

type WelcomeEmailProps = {
  name: string;
  dashboardUrl: string;
  siteName: string;
  siteUrl: string;
};

export const WelcomeEmail = ({
  name = "",
  dashboardUrl,
  siteName,
  siteUrl,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to {siteName}! Get started with your new account</Preview>
    <Tailwind>
      <Body className="bg-white font-sans">
        <Container className="mx-auto py-5 pb-12">
          <Text className="text-center text-xl font-bold">{siteName}</Text>
          <Section>
            <Text className="text-base">Hi {name},</Text>
            <Text className="text-lg font-medium">
              Welcome to {siteName}! 🎉
            </Text>
            <Text className="text-base">
              We&apos;re thrilled to have you join our community. Your account
              has been successfully created and is ready to use.
            </Text>
          </Section>

          <Section className="my-6">
            <Text className="text-base font-medium">
              Here&apos;s what you can do now:
            </Text>
            <Text className="my-2 pl-4 text-sm">
              • Complete your profile information
            </Text>
            <Text className="my-2 pl-4 text-sm">
              • Explore our features and services
            </Text>
            <Text className="my-2 pl-4 text-sm">
              • Set up your workspace preferences
            </Text>
            <Text className="my-2 pl-4 text-sm">
              • Check out our documentation and help center
            </Text>
          </Section>

          <Section className="my-5 text-center">
            <Button
              className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-base text-white no-underline"
              href={dashboardUrl}
            >
              Go to Dashboard
            </Button>
          </Section>

          <Section className="my-6 rounded-md bg-gray-50 p-4">
            <Text className="text-base font-medium">
              Need help getting started?
            </Text>
            <Text className="text-sm">
              Our support team is always here to help. Feel free to reach out if
              you have any questions or need assistance.
            </Text>
            <Text className="text-sm">
              Visit our{" "}
              <a href={`${siteUrl}/docs`} className="text-blue-600">
                documentation
              </a>{" "}
              for detailed guides and tutorials.
            </Text>
          </Section>

          <Text className="text-base">
            Thanks for choosing {siteName}. We&apos;re excited to see what
            you&apos;ll achieve!
          </Text>

          <Hr className="my-4 border-t-2 border-gray-200" />

          <Text className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);
