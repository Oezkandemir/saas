import React, { useEffect, useState } from 'react';
import { View, RefreshControl } from 'react-native';
import { AppScrollView } from '~/components/ui/scroll-view';
import { Text } from '~/components/ui/text';
import { useAuth } from '~/lib/auth-context';
import { supabase } from '~/lib/supabase';
import { Users } from '~/lib/icons/Users';
import { Activity } from '~/lib/icons/Activity';
import { UserPlus } from '~/lib/icons/UserPlus';
import { useColorScheme } from '~/lib/useColorScheme';
import { StatusBar } from '~/components/layout/StatusBar';

interface UserStats {
  totalUsers: number;
  recentSignUps: number;
  activeToday: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { isDarkColorScheme } = useColorScheme();
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

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Loading dashboard...</Text>
      </View>
    );
  }

  const statusBarItems = [
    {
      icon: <Users size={16} color={isDarkColorScheme ? '#9ca3af' : '#6b7280'} />,
      value: userStats?.totalUsers?.toString() || '0',
      label: 'Total Users',
    },
    {
      icon: <UserPlus size={16} color={isDarkColorScheme ? '#9ca3af' : '#6b7280'} />,
      value: userStats?.recentSignUps?.toString() || '0',
      label: 'New Signups',
    },
    {
      icon: <Activity size={16} color={isDarkColorScheme ? '#9ca3af' : '#6b7280'} />,
      value: userStats?.activeToday?.toString() || '0',
      label: 'Active Today',
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <StatusBar items={statusBarItems} />
      <AppScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-6">
          {/* Dashboard content can be added here if needed */}
        </View>
      </AppScrollView>
    </View>
  );
}
