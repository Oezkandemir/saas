import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { H1, Muted } from '~/components/ui/typography';
import { useAuth } from '~/lib/auth-context';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(email, password, name);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Success', 
          'Please check your email to confirm your account',
          [{ text: 'OK', onPress: () => router.push('/signin') }]
        );
      }
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
          <H1 className="text-center">Create Account</H1>
          <Muted className="text-center">
            Join Cenety to get started
          </Muted>
        </View>

        {/* Form */}
        <View className="gap-4">
          <View>
            <Text className="mb-2 font-medium">Name</Text>
            <Input
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
            />
          </View>

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
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />
            <Muted className="mt-1">Must be at least 6 characters</Muted>
          </View>

          <Button 
            onPress={handleSignUp}
            disabled={loading}
            className="w-full mt-2"
          >
            <Text>{loading ? 'Creating Account...' : 'Create Account'}</Text>
          </Button>
        </View>

        {/* Footer */}
        <View className="items-center gap-4">
          <Button 
            variant="ghost"
            onPress={() => router.push('/signin')}
          >
            <Text>Already have an account? Sign in</Text>
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