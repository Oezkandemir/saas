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

type TeamInvitationEmailProps = {
  inviterName: string;
  inviterEmail: string;
  teamName: string;
  teamSlug: string;
  role: string;
  actionUrl: string;
  siteName: string;
  siteUrl: string;
};

export default function TeamInvitationEmail({
  inviterName = "John Doe",
  inviterEmail = "john@example.com",
  teamName = "Awesome Team",
  teamSlug = "awesome-team",
  role = "MEMBER",
  actionUrl = "https://example.com/teams/join",
  siteName = "Next.js SaaS Starter",
  siteUrl = "https://example.com",
}: TeamInvitationEmailProps) {
  const previewText = `${inviterName} has invited you to join ${teamName} on ${siteName}`;
  
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "OWNER":
        return "Owner";
      case "ADMIN":
        return "Administrator";
      case "MEMBER":
        return "Member";
      case "GUEST":
        return "Guest";
      default:
        return "Member";
    }
  };

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
              <Text className="text-lg font-semibold">
                You&apos;ve been invited to join {teamName}!
              </Text>
              <Text className="text-gray-600">
                <strong>{inviterName}</strong> ({inviterEmail}) has invited you to join the team &quot;{teamName}&quot; as a <strong>{getRoleDisplayName(role)}</strong> on {siteName}.
              </Text>
            </Section>

            <Section className="mt-6 rounded-lg bg-gray-50 p-4">
              <Text className="mb-2 text-sm font-semibold text-gray-700">Team Details:</Text>
              <Text className="mb-1 text-sm text-gray-600">
                <strong>Team:</strong> {teamName}
              </Text>
              <Text className="mb-1 text-sm text-gray-600">
                <strong>Role:</strong> {getRoleDisplayName(role)}
              </Text>
              <Text className="text-sm text-gray-600">
                <strong>Invited by:</strong> {inviterName}
              </Text>
            </Section>

            <Section className="mt-8">
              <Text className="text-gray-600">
                Click the button below to accept the invitation and join the team:
              </Text>
              <Button
                className="mt-4 rounded bg-black px-6 py-3 text-center text-sm font-medium text-white"
                href={actionUrl}
              >
                Accept Invitation & Join Team
              </Button>
            </Section>

            <Section className="mt-8">
              <Text className="text-sm text-gray-500">
                This invitation will expire in 7 days. If you don&apos;t want to join this team, you can safely ignore this email.
              </Text>
              <Text className="text-sm text-gray-500">
                If you have any questions, you can contact {inviterName} directly at {inviterEmail}.
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