"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getUserStats,
  searchUsers,
  type UserSearchResult,
} from "@/actions/user-search-actions";
import { Crown, Search, Users } from "lucide-react";

import { logger } from "@/lib/logger";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function UserSearch() {
  const router = useRouter();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    recentJoins: 0,
  });
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load all users and stats on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);

        // Fetch all users and stats
        const [usersResult, statsData] = await Promise.all([
          searchUsers({}, 1, 100), // Get first 100 users
          getUserStats(),
        ]);

        setUsers(usersResult.users);
        setFilteredUsers(usersResult.users);
        setStats(statsData);
      } catch (error) {
        logger.error("Failed to load users:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  // Debounce search query (300ms delay)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Filter users based on debounced search query
  useEffect(() => {
    if (debouncedSearchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = debouncedSearchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query),
      );
      setFilteredUsers(filtered);
    }
  }, [debouncedSearchQuery, users]);

  // Navigate to user profile
  const navigateToProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="size-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Crown className="size-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Admins</p>
                <p className="text-2xl font-bold">{stats.totalAdmins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Search className="size-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Showing</p>
                <p className="text-2xl font-bold">{filteredUsers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Search Users</h2>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setSearchQuery("")}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">
            All Users ({filteredUsers.length})
          </h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <UserCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onProfileClick={navigateToProfile}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? `No users found for "${searchQuery}"`
                  : "No users found."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UserCard({
  user,
  onProfileClick,
}: {
  user: UserSearchResult;
  onProfileClick: (userId: string) => void;
}) {
  // Helper function to get role badge variant and color
  const getRoleBadge = (role: string) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return {
          variant: "destructive" as const,
          icon: Crown,
          label: "Admin",
          className: "text-xs",
        };
      case "USER":
        return {
          variant: "secondary" as const,
          icon: null,
          label: "User",
          className: "text-xs",
        };
      default:
        return {
          variant: "outline" as const,
          icon: null,
          label: role || "Unknown",
          className: "text-xs",
        };
    }
  };

  const roleBadge = getRoleBadge(user.role);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar
            className="cursor-pointer"
            onClick={() => onProfileClick(user.id)}
          >
            <AvatarImage src={user.avatar_url || ""} alt={user.name || ""} />
            <AvatarFallback>
              {user.name?.slice(0, 2)?.toUpperCase() ||
                user.email?.slice(0, 2)?.toUpperCase() ||
                "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3
                className="font-medium text-sm truncate cursor-pointer hover:underline"
                onClick={() => onProfileClick(user.id)}
              >
                {user.name || "Anonymous"}
              </h3>
              <Badge
                variant={roleBadge.variant}
                className={roleBadge.className}
              >
                {roleBadge.icon && <roleBadge.icon className="size-3 mr-1" />}
                {roleBadge.label}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              Joined {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="mt-3">
          <Skeleton className="h-8 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
