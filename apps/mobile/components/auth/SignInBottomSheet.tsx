import React, { useState } from 'react';
import { View, Alert, Platform } from 'react-native';
import { DeprecatedUi } from '@rnr/reusables';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Text } from '../ui/text';
import { H1 } from '../ui/typography';
import { useAuth } from '~/lib/auth-context';
import { cn } from '~/lib/utils';

const {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetView,
  BottomSheetCloseTrigger,
} = DeprecatedUi;

interface SignInBottomSheetProps {
  children: React.ReactNode;
}

export function SignInBottomSheet({ children }: SignInBottomSheetProps) {
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
    const { error } = await signIn(email, password);
    
    if (error) {
      Alert.alert('Sign In Error', error.message || 'An error occurred');
    }
    setLoading(false);
  };

  return (
    <BottomSheet>
      {children}
      <BottomSheetContent>
        <BottomSheetHeader>
          <H1 className='text-center pb-1'>Sign In</H1>
        </BottomSheetHeader>
        <BottomSheetView className='gap-5 pt-6'>
          <View className='gap-4'>
            <Input
              placeholder='Email'
              value={email}
              onChangeText={setEmail}
              keyboardType='email-address'
              autoCapitalize='none'
              autoComplete='email'
            />
            
            <Input
              placeholder='Password'
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete='password'
            />
            
            <BottomSheetCloseTrigger asChild>
              <Button 
                onPress={handleSignIn} 
                disabled={loading}
                className='mt-4'
              >
                <Text>{loading ? 'Signing In...' : 'Sign In'}</Text>
              </Button>
            </BottomSheetCloseTrigger>
            
            <Button 
              variant='ghost' 
              disabled={loading}
              onPress={() => {
                Alert.alert('Coming Soon', 'Sign up will be available soon');
              }}
            >
              <Text>Don't have an account? Sign Up</Text>
            </Button>
          </View>
          
          <View className={cn(Platform.OS === 'android' && 'pb-2')}>
            <BottomSheetCloseTrigger asChild>
              <Button variant='outline' disabled={loading}>
                <Text>Cancel</Text>
              </Button>
            </BottomSheetCloseTrigger>
          </View>
        </BottomSheetView>
      </BottomSheetContent>
    </BottomSheet>
  );
} 