import React, { useEffect, useState } from 'react';
import { View, RefreshControl } from 'react-native';
import { AppScrollView } from '~/components/ui/scroll-view';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import { Text } from '~/components/ui/text';
import { H1, H2, Muted } from '~/components/ui/typography';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { useAuth } from '~/lib/auth-context';
import { supabase } from '~/lib/supabase';
import { router } from 'expo-router';

interface UserStats {
  totalUsers: number;
  recentSignUps: number;
  activeToday: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch recent signups (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentSignUps } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      // For demo purposes, we'll calculate some stats
      const activeToday = Math.floor((totalUsers || 0) * 0.1); // 10% of users active today

      setUserStats({
        totalUsers: totalUsers || 0,
        recentSignUps: recentSignUps || 0,
        activeToday,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Set fallback data
      setUserStats({
        totalUsers: 0,
        recentSignUps: 0,
        activeToday: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserStats();
  };

  const stats = [
    { 
      title: 'Total Users', 
      value: userStats?.totalUsers?.toString() || '0', 
      change: '+5.2%',
      changeType: 'positive' as const,
      description: 'All registered users'
    },
    { 
      title: 'New Signups', 
      value: userStats?.recentSignUps?.toString() || '0', 
      change: '+12%',
      changeType: 'positive' as const,
      description: 'Last 7 days'
    },
    { 
      title: 'Active Today', 
      value: userStats?.activeToday?.toString() || '0', 
      change: '+8%',
      changeType: 'positive' as const,
      description: 'Users active today'
    },
  ];

  const userName = user?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Loading dashboard...</Text>
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
        {/* User Section */}
        <Card>
          <CardContent className="flex-row items-center p-4">
            <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Text className="text-xl font-semibold text-primary">
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            
            <View className="flex-1">
              <H2>{userName}</H2>
              <Muted>{userEmail}</Muted>
              <Badge variant="secondary" className="mt-1">
                <Text>Premium User</Text>
              </Badge>
            </View>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <View className="gap-4">
          <H2>Overview</H2>
          
          <View className="flex-row flex-wrap gap-3">
            {stats.map((stat, index) => (
              <Card key={index} className="min-w-[45%] flex-1">
                <CardContent className="p-4">
                  <View className="items-start gap-2">
                    <Text className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </Text>
                    
                    <View className="flex-row items-center gap-2">
                      <Badge 
                        variant={stat.changeType === 'positive' ? 'default' : 'secondary'}
                        className="py-0"
                      >
                        <Text className="text-xs">{stat.change}</Text>
                      </Badge>
                    </View>
                    
                    <Text className="font-medium text-foreground">
                      {stat.title}
                    </Text>
                    
                    <Muted className="text-xs">
                      {stat.description}
                    </Muted>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="gap-4">
          <H2>Quick Actions</H2>
          
          <View className="gap-3">
            <Button className="w-full justify-start" variant="outline">
              <Text>📊 View Analytics</Text>
            </Button>
            
            <Button className="w-full justify-start" variant="outline">
              <Text>👥 Manage Users</Text>
            </Button>
            
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onPress={() => router.push('/(tabs)/billing')}
            >
              <Text>💳 Billing & Plans</Text>
            </Button>
            
            <Button className="w-full justify-start" variant="outline">
              <Text>⚙️ Settings</Text>
            </Button>
          </View>
        </View>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <Text className="text-xs text-green-600">✓</Text>
              </View>
              <View className="flex-1">
                <Text className="font-medium">New user registered</Text>
                <Muted className="text-xs">2 minutes ago</Muted>
              </View>
            </View>
            
            <View className="flex-row items-center gap-3">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Text className="text-xs text-blue-600">📊</Text>
              </View>
              <View className="flex-1">
                <Text className="font-medium">Analytics report generated</Text>
                <Muted className="text-xs">1 hour ago</Muted>
              </View>
            </View>
            
            <View className="flex-row items-center gap-3">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                <Text className="text-xs text-purple-600">🔄</Text>
              </View>
              <View className="flex-1">
                <Text className="font-medium">Database backup completed</Text>
                <Muted className="text-xs">3 hours ago</Muted>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>
    </AppScrollView>
  );
}
