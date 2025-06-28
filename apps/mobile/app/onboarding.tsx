import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { H1, H2, Muted } from '~/components/ui/typography';

export default function OnboardingScreen() {
  return (
    <View className="flex-1 bg-background justify-center items-center p-6">
      <View className="w-full max-w-md gap-8">
        {/* Features */}
        <View className="items-center gap-6">
          <H1 className="text-center">Welcome to Cenety</H1>
          
          <View className="gap-4">
            <View className="items-center gap-2">
              <View className="w-12 h-12 bg-primary/20 rounded-xl justify-center items-center">
                <Text className="text-lg">🚀</Text>
              </View>
              <H2 className="text-center">Fast & Secure</H2>
              <Muted className="text-center">
                Built with modern technology for the best performance
              </Muted>
            </View>
            
            <View className="items-center gap-2">
              <View className="w-12 h-12 bg-primary/20 rounded-xl justify-center items-center">
                <Text className="text-lg">✨</Text>
              </View>
              <H2 className="text-center">Beautiful Design</H2>
              <Muted className="text-center">
                Clean and intuitive interface that you'll love to use
              </Muted>
            </View>
            
            <View className="items-center gap-2">
              <View className="w-12 h-12 bg-primary/20 rounded-xl justify-center items-center">
                <Text className="text-lg">🔒</Text>
              </View>
              <H2 className="text-center">Your Privacy</H2>
              <Muted className="text-center">
                Your data is secure and protected with us
              </Muted>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="gap-4">
          <Button 
            onPress={() => router.push('/signin')}
            className="w-full"
          >
            <Text>Continue</Text>
          </Button>
          
          <Button 
            variant="ghost"
            onPress={() => router.back()}
          >
            <Text>← Back</Text>
          </Button>
        </View>
      </View>
    </View>
  );
} 