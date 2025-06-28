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

type SignupConfirmationEmailProps = {
  name: string;
  actionUrl: string;
  siteName: string;
};

export const SignupConfirmationEmail = ({
  name = "",
  actionUrl,
  siteName,
}: SignupConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>
      Confirm your email address to complete your {siteName} registration
    </Preview>
    <Tailwind>
      <Body className="bg-white font-sans">
        <Container className="mx-auto py-5 pb-12">
          <Text className="text-center text-xl font-bold">{siteName}</Text>
          <Text className="text-base">Hi {name},</Text>
          <Text className="text-base">
            Thanks for signing up for {siteName}! To complete your registration
            and verify your email address, please click the button below:
          </Text>
          <Section className="my-5 text-center">
            <Button
              className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-base text-white no-underline"
              href={actionUrl}
            >
              Confirm Email Address
            </Button>
          </Section>
          <Text className="text-base">
            This link expires in 24 hours and can only be used once.
          </Text>
          <Text className="text-base">
            If you did not create an account with {siteName}, you can safely
            ignore this email.
          </Text>
          <Hr className="my-4 border-t-2 border-gray-300" />
          <Text className="text-center text-sm text-gray-600">
            Powered by {siteName}
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);
