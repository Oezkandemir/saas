import { Suspense } from 'react';
import { Metadata } from 'next';
import { UserSearch } from './user-search';

export const metadata: Metadata = {
  title: 'Users - Dashboard',
  description: 'Search and discover users',
};

import { UnifiedPageLayout } from "@/components/layout/unified-page-layout";
import { Users } from "lucide-react";

export default function UsersPage() {
  return (
    <UnifiedPageLayout
      title="Users"
      description="Search and discover users in the community"
      icon={<Users className="h-4 w-4 text-primary" />}
    >
      <Suspense fallback={<div>Loading...</div>}>
        <UserSearch />
      </Suspense>
    </UnifiedPageLayout>
  );
} 