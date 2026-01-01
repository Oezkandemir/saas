import React, { useEffect, useState } from 'react';
import { View, RefreshControl } from 'react-native';
import { AppScrollView } from '~/components/ui/scroll-view';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import { Text } from '~/components/ui/text';
import { H1, Muted } from '~/components/ui/typography';
import { Badge } from '~/components/ui/badge';
import { supabase } from '~/lib/supabase';
import { Users } from '~/lib/icons/Users';
import { UserPlus } from '~/lib/icons/UserPlus';
import { Activity } from '~/lib/icons/Activity';
import { BarChart3 } from '~/lib/icons/BarChart3';
import { useColorScheme } from '~/lib/useColorScheme';
import { StatusBar } from '~/components/layout/StatusBar';

interface AnalyticsData {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsers: number;
  userGrowthRate: number;
  topCountries: Array<{ country: string; users: number }>;
  monthlyStats: Array<{ month: string; users: number; signups: number }>;
}

export default function AnalyticsScreen() {
  const { isDarkColorScheme } = useColorScheme();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch user analytics from Supabase
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Get new users this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const { count: newUsersThisMonth } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonth.toISOString());

      // Calculate growth rate and active users (mock data)
      const userGrowthRate = ((newUsersThisMonth || 0) / Math.max(totalUsers || 1, 1)) * 100;
      const activeUsers = Math.floor((totalUsers || 0) * 0.3); // 30% active

      // Mock data for demonstration
      const topCountries = [
        { country: 'United States', users: Math.floor((totalUsers || 0) * 0.4) },
        { country: 'Germany', users: Math.floor((totalUsers || 0) * 0.25) },
        { country: 'United Kingdom', users: Math.floor((totalUsers || 0) * 0.15) },
        { country: 'Canada', users: Math.floor((totalUsers || 0) * 0.12) },
        { country: 'Australia', users: Math.floor((totalUsers || 0) * 0.08) },
      ];

      const monthlyStats = [
        { month: 'Jan', users: Math.floor((totalUsers || 0) * 0.7), signups: 15 },
        { month: 'Feb', users: Math.floor((totalUsers || 0) * 0.8), signups: 23 },
        { month: 'Mar', users: Math.floor((totalUsers || 0) * 0.9), signups: 31 },
        { month: 'Apr', users: totalUsers || 0, signups: newUsersThisMonth || 0 },
      ];

      setAnalytics({
        totalUsers: totalUsers || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        activeUsers,
        userGrowthRate,
        topCountries,
        monthlyStats,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set fallback data
      setAnalytics({
        totalUsers: 0,
        newUsersThisMonth: 0,
        activeUsers: 0,
        userGrowthRate: 0,
        topCountries: [],
        monthlyStats: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const statusBarItems = [
    {
      icon: <Users size={16} color={isDarkColorScheme ? '#9ca3af' : '#6b7280'} />,
      value: analytics?.totalUsers?.toString() || '0',
      label: 'Total Users',
    },
    {
      icon: <UserPlus size={16} color={isDarkColorScheme ? '#9ca3af' : '#6b7280'} />,
      value: analytics?.newUsersThisMonth?.toString() || '0',
      label: 'New This Month',
    },
    {
      icon: <Activity size={16} color={isDarkColorScheme ? '#9ca3af' : '#6b7280'} />,
      value: analytics?.activeUsers?.toString() || '0',
      label: 'Active Users',
    },
    {
      icon: <BarChart3 size={16} color={isDarkColorScheme ? '#9ca3af' : '#6b7280'} />,
      value: `${((analytics?.activeUsers || 0) / Math.max(analytics?.totalUsers || 1, 1) * 100).toFixed(1)}%`,
      label: 'Engagement',
    },
  ];

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-muted-foreground">Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar items={statusBarItems} />
      <AppScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-6 gap-6">
          {/* Header */}
          <View className="gap-2">
            <H1>Analytics Dashboard</H1>
            <Muted>Track your app's performance and user engagement</Muted>
          </View>

        {/* User Growth Chart */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>User Growth Trend</CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            {analytics?.monthlyStats.map((stat, index) => (
              <View key={index} className="flex-row items-center gap-4">
                <View className="w-12">
                  <Text className="font-medium">{stat.month}</Text>
                </View>
                
                <View className="flex-1">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-sm">Users: {stat.users}</Text>
                    <Text className="text-sm text-muted-foreground">+{stat.signups}</Text>
                  </View>
                  
                  <View className="h-2 bg-muted rounded-full overflow-hidden">
                    <View 
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(stat.users / Math.max(analytics?.totalUsers || 1, 1)) * 100}%`
                      }}
                    />
                  </View>
                </View>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Top Countries</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            {analytics?.topCountries.map((country, index) => (
              <View key={index} className="flex-row items-center gap-4">
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                  <Text className="text-xs font-medium">{index + 1}</Text>
                </View>
                
                <View className="flex-1">
                  <View className="flex-row justify-between mb-1">
                    <Text className="font-medium">{country.country}</Text>
                    <Text className="text-muted-foreground">{country.users} users</Text>
                  </View>
                  
                  <View className="h-2 bg-muted rounded-full overflow-hidden">
                    <View 
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${(country.users / Math.max(analytics?.totalUsers || 1, 1)) * 100}%`
                      }}
                    />
                  </View>
                </View>
              </View>
            ))}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text>Average Session Duration</Text>
              <Badge variant="secondary">
                <Text>4m 32s</Text>
              </Badge>
            </View>
            
            <View className="flex-row items-center justify-between">
              <Text>Bounce Rate</Text>
              <Badge variant="secondary">
                <Text>23.5%</Text>
              </Badge>
            </View>
            
            <View className="flex-row items-center justify-between">
              <Text>Retention Rate (7 days)</Text>
              <Badge variant="default">
                <Text>68.2%</Text>
              </Badge>
            </View>
            
            <View className="flex-row items-center justify-between">
              <Text>App Crashes</Text>
              <Badge variant="secondary">
                <Text>0.02%</Text>
              </Badge>
            </View>
          </CardContent>
        </Card>
      </View>
    </AppScrollView>
    </View>
  );
} 