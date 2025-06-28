import React, { useEffect, useState } from 'react';
import { View, RefreshControl, Alert } from 'react-native';
import { AppScrollView } from '~/components/ui/scroll-view';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import { Text } from '~/components/ui/text';
import { H1, H2, Muted } from '~/components/ui/typography';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { useAuth } from '~/lib/auth-context';
import { supabase } from '~/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  role?: string;
}

export default function UsersScreen() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const totalUsers = users.length;
  const newUsersThisMonth = users.filter(user => {
    const userDate = new Date(user.created_at);
    const thisMonth = new Date();
    thisMonth.setDate(1);
    return userDate >= thisMonth;
  }).length;

  const adminUsers = users.filter(user => user.role === 'ADMIN').length;
  const activeUsers = Math.floor(totalUsers * 0.7); // Mock 70% active

  if (loading) {
    return (
      <View className="items-center justify-center flex-1 bg-background">
        <Text className="text-muted-foreground">Loading users...</Text>
      </View>
    );
  }

  return (
    <AppScrollView 
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="gap-6 p-6">
        {/* Header */}
        <View className="gap-2">
          <H1>User Management</H1>
          <Muted>Manage and monitor your app users</Muted>
        </View>

        {/* User Stats */}
        <View className="flex-row flex-wrap gap-3">
          <Card className="flex-1 min-w-[45%]">
            <CardContent className="p-4">
              <Text className="text-2xl font-bold text-foreground">
                {totalUsers}
              </Text>
              <Text className="font-medium text-foreground">Total Users</Text>
              <Muted className="text-xs">All registered users</Muted>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[45%]">
            <CardContent className="p-4">
              <Text className="text-2xl font-bold text-foreground">
                {newUsersThisMonth}
              </Text>
              <Text className="font-medium text-foreground">New This Month</Text>
              <Badge variant="default" className="mt-1">
                <Text className="text-xs">+{((newUsersThisMonth / Math.max(totalUsers, 1)) * 100).toFixed(1)}%</Text>
              </Badge>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[45%]">
            <CardContent className="p-4">
              <Text className="text-2xl font-bold text-foreground">
                {activeUsers}
              </Text>
              <Text className="font-medium text-foreground">Active Users</Text>
              <Muted className="text-xs">Last 30 days</Muted>
            </CardContent>
          </Card>

          <Card className="flex-1 min-w-[45%]">
            <CardContent className="p-4">
              <Text className="text-2xl font-bold text-foreground">
                {adminUsers}
              </Text>
              <Text className="font-medium text-foreground">Admin Users</Text>
              <Muted className="text-xs">With admin privileges</Muted>
            </CardContent>
          </Card>
        </View>

        {/* Search */}
        <View className="gap-2">
          <Text className="font-medium">Search Users</Text>
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="w-full"
          />
        </View>

        {/* Users List */}
        <View className="gap-4">
          <View className="flex-row items-center justify-between">
            <H2>Users ({filteredUsers.length})</H2>
            <Button variant="outline" size="sm">
              <Text>+ Invite User</Text>
            </Button>
          </View>

          <View className="gap-3">
            {filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="flex-row items-center p-4">
                  <View className="items-center justify-center w-12 h-12 mr-4 rounded-full bg-primary/10">
                    {user.avatar_url ? (
                      // Would show image here if we had Image component
                      <Text className="text-lg font-semibold text-primary">
                        {getInitials(user.name, user.email)}
                      </Text>
                    ) : (
                      <Text className="text-lg font-semibold text-primary">
                        {getInitials(user.name, user.email)}
                      </Text>
                    )}
                  </View>
                  
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="font-semibold text-foreground">
                        {user.name || 'No Name'}
                      </Text>
                      
                      {user.role === 'ADMIN' && (
                        <Badge variant="default">
                          <Text className="text-xs">Admin</Text>
                        </Badge>
                      )}
                      
                      {user.id === currentUser?.id && (
                        <Badge variant="secondary">
                          <Text className="text-xs">You</Text>
                        </Badge>
                      )}
                    </View>
                    
                    <Text className="mb-1 text-sm text-muted-foreground">
                      {user.email}
                    </Text>
                    
                    <Text className="text-xs text-muted-foreground">
                      Joined {formatDate(user.created_at)}
                    </Text>
                  </View>
                  
                  <View className="items-end gap-1">
                    <Badge variant="outline">
                      <Text className="text-xs">Active</Text>
                    </Badge>
                  </View>
                </CardContent>
              </Card>
            ))}

            {filteredUsers.length === 0 && (
              <Card>
                <CardContent className="items-center p-8">
                  <Text className="text-muted-foreground">
                    {searchQuery ? 'No users found matching your search.' : 'No users found.'}
                  </Text>
                </CardContent>
              </Card>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="gap-4">
          <H2>Quick Actions</H2>
          
          <View className="gap-3">
            <Button variant="outline" className="justify-start w-full">
              <Text>📧 Send Newsletter</Text>
            </Button>
            
            <Button variant="outline" className="justify-start w-full">
              <Text>📊 Export User Data</Text>
            </Button>
            
            <Button variant="outline" className="justify-start w-full">
              <Text>👥 Bulk User Operations</Text>
            </Button>
            
            <Button variant="outline" className="justify-start w-full">
              <Text>🔒 Manage Permissions</Text>
            </Button>
          </View>
        </View>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent User Activity</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className="items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                <Text className="text-xs text-green-600">+</Text>
              </View>
              <View className="flex-1">
                <Text className="font-medium">New user registration</Text>
                <Muted className="text-xs">user@example.com joined 5 minutes ago</Muted>
              </View>
            </View>
            
            <View className="flex-row items-center gap-3">
              <View className="items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                <Text className="text-xs text-blue-600">✓</Text>
              </View>
              <View className="flex-1">
                <Text className="font-medium">Email verification completed</Text>
                <Muted className="text-xs">jane@example.com verified 1 hour ago</Muted>
              </View>
            </View>
            
            <View className="flex-row items-center gap-3">
              <View className="items-center justify-center w-8 h-8 bg-purple-100 rounded-full">
                <Text className="text-xs text-purple-600">🔄</Text>
              </View>
              <View className="flex-1">
                <Text className="font-medium">Profile update</Text>
                <Muted className="text-xs">john@example.com updated profile 2 hours ago</Muted>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>
    </AppScrollView>
  );
} 