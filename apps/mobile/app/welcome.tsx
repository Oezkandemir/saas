import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { H1, H2 } from '~/components/ui/typography';

export default function WelcomeScreen() {
  return (
    <View className="flex-1 bg-background justify-center items-center p-6">
      <View className="w-full max-w-md gap-8">
        {/* Logo/Brand Section */}
        <View className="items-center gap-4">
          <View className="w-20 h-20 bg-primary rounded-2xl justify-center items-center">
            <Text className="text-2xl font-bold text-primary-foreground">C</Text>
          </View>
          <View className="items-center gap-2">
            <H1 className="text-center">Welcome to Cenety</H1>
            <H2 className="text-center text-muted-foreground">
              Your journey starts here
            </H2>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="gap-4">
          <Button 
            onPress={() => router.push('/onboarding')}
            className="w-full"
          >
            <Text>Get Started</Text>
          </Button>
          
          <Button 
            variant="outline"
            onPress={() => router.push('/signin')}
            className="w-full"
          >
            <Text>I already have an account</Text>
          </Button>
        </View>
      </View>
    </View>
  );
} 