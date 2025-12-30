import { Suspense } from 'react';
import { Metadata } from 'next';
import { UserSearch } from './user-search';

export const metadata: Metadata = {
  title: 'Users - Dashboard',
  description: 'Search and discover users',
};

export default function UsersPage() {
  return (
    <div className="w-full py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">
          Search and discover users in the community
        </p>
      </div>
      
      <Suspense fallback={<div>Loading...</div>}>
        <UserSearch />
      </Suspense>
    </div>
  );
} 