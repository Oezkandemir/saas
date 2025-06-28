import React from 'react';
import { View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Button } from '~/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import { Text } from '~/components/ui/text';
import { H1, H2, Muted } from '~/components/ui/typography';
import { Badge } from '~/components/ui/badge';
import { useAuth } from '~/lib/auth-context';

export default function HomeScreen() {
  const { user } = useAuth();

  const features = [
    {
      title: 'React Native & Expo',
      description: 'Built with the latest Expo SDK and React Native for native performance',
      emoji: '📱',
      color: 'bg-blue-100',
    },
    {
      title: 'Lightning Fast',
      description: 'Optimized performance with native components and efficient rendering',
      emoji: '⚡',
      color: 'bg-yellow-100',
    },
    {
      title: 'Secure by Design',
      description: 'Enterprise-grade security with Supabase authentication',
      emoji: '🛡️',
      color: 'bg-green-100',
    },
    {
      title: 'Real-time Updates',
      description: 'Live data synchronization and push notifications',
      emoji: '🌐',
      color: 'bg-purple-100',
    },
  ];

  const stats = [
    { label: 'Native Performance', value: '60 FPS' },
    { label: 'Cross Platform', value: 'iOS & Android' },
    { label: 'Bundle Size', value: '< 50MB' },
    { label: 'Load Time', value: '< 2s' },
  ];

  const userName = user?.name || user?.email?.split('@')[0] || 'User';

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="gap-6 p-6">
        {/* Hero Section */}
        <View className="items-center gap-4">
          <Badge variant="secondary">
            <Text>Welcome back, {userName}!</Text>
          </Badge>
          
          <H1 className="text-center">
            Your Mobile Dashboard
          </H1>
          
          <Muted className="text-center">
            Built with React Native, Expo & Supabase for the next generation of mobile apps
          </Muted>
          
          <View className="flex-row w-full gap-3">
            <Button 
              onPress={() => router.push('/(tabs)')}
              className="flex-1"
            >
              <Text>View Dashboard</Text>
            </Button>
            
            <Button 
              variant="outline"
              onPress={() => router.push('/(tabs)/analytics')}
              className="flex-1"
            >
              <Text>Analytics</Text>
            </Button>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap gap-3">
          {stats.map((stat, index) => (
            <Card key={index} className="flex-1 min-w-[45%]">
              <CardContent className="items-center p-4">
                <Text className="text-xl font-bold text-foreground">
                  {stat.value}
                </Text>
                <Muted className="text-xs text-center">
                  {stat.label}
                </Muted>
              </CardContent>
            </Card>
          ))}
        </View>

        {/* Features Section */}
        <View className="gap-4">
          <H2>Why Choose Our Platform?</H2>
          
          <View className="gap-4">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardContent className="flex-row items-start gap-4 p-4">
                  <View className="items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                    <Text className="text-xl">{feature.emoji}</Text>
                  </View>
                  
                  <View className="flex-1">
                    <Text className="mb-1 font-semibold text-foreground">
                      {feature.title}
                    </Text>
                    <Muted className="text-sm">
                      {feature.description}
                    </Muted>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Ready to get started?</CardTitle>
          </CardHeader>
          <CardContent className="items-center gap-4">
            <Muted className="text-center">
              Explore all features and start building amazing mobile experiences
            </Muted>
            
            <Button 
              onPress={() => router.push('/(tabs)/users')}
              className="w-full"
            >
              <Text>Explore Users →</Text>
            </Button>
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
} 