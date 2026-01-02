import Link from "next/link";
import { Button } from '@/components/alignui/actions/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/alignui/data-display/card';

interface UpgradeCardProps {
  isFreePlan?: boolean;
}

export function UpgradeCard({ isFreePlan = true }: UpgradeCardProps) {
  // Only show card if user is on free plan
  if (!isFreePlan) {
    return null;
  }

  return (
    <Card className="md:max-xl:rounded-none md:max-xl:border-none md:max-xl:shadow-none">
      <CardHeader className="md:max-xl:px-4">
        <CardTitle>Upgrade to Pro</CardTitle>
        <CardDescription>
          Unlock all features and get unlimited access to our support team.
        </CardDescription>
      </CardHeader>
      <CardContent className="md:max-xl:px-4">
        <Button size="sm" className="w-full" asChild>
          <Link href="/pricing">Upgrade</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
