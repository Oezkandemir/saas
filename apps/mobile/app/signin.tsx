import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { H1, Muted } from '~/components/ui/typography';
import { useAuth } from '~/lib/auth-context';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        Alert.alert('Error', error.message);
      }
      // Success - user will be automatically redirected by auth state change
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background justify-center items-center p-6">
      <View className="w-full max-w-md gap-8">
        {/* Header */}
        <View className="items-center gap-2">
          <H1 className="text-center">Welcome back</H1>
          <Muted className="text-center">
            Sign in to your account to continue
          </Muted>
        </View>

        {/* Form */}
        <View className="gap-4">
          <View>
            <Text className="mb-2 font-medium">Email</Text>
            <Input
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View>
            <Text className="mb-2 font-medium">Password</Text>
            <Input
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <Button 
            onPress={handleSignIn}
            disabled={loading}
            className="w-full mt-2"
          >
            <Text>{loading ? 'Signing In...' : 'Sign In'}</Text>
          </Button>
        </View>

        {/* Footer */}
        <View className="items-center gap-4">
          <Button 
            variant="ghost"
            onPress={() => router.push('/signup')}
          >
            <Text>Don't have an account? Sign up</Text>
          </Button>
          
          <Button 
            variant="ghost"
            onPress={() => router.back()}
          >
            <Text>← Back to Welcome</Text>
          </Button>
        </View>
      </View>
    </View>
  );
} 