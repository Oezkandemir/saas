import React from 'react';
import { View, Image, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { DeprecatedUi } from '@rnr/reusables';
import { Button } from '../ui/button';
import { Text } from '../ui/text';
import { H2 } from '../ui/typography';
import { useAuth } from '~/lib/auth-context';
import { CircleUserRound } from '~/lib/icons/CircleUserRound';
import { cn } from '~/lib/utils';

const {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetView,
  BottomSheetCloseTrigger,
} = DeprecatedUi;

interface UserMenuBottomSheetProps {
  children: React.ReactNode;
}

export function UserMenuBottomSheet({ children }: UserMenuBottomSheetProps) {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  if (!user) return null;

  return (
    <BottomSheet>
      {children}
      <BottomSheetContent>
        <BottomSheetHeader>
          <H2 className='text-center pb-1'>User Menu</H2>
        </BottomSheetHeader>
        <BottomSheetView className='gap-5 pt-6'>
          <View className='items-center mb-6'>
            {user.image ? (
              <Image
                source={{ uri: user.image }}
                className='w-20 h-20 rounded-full mb-4'
                resizeMode='cover'
              />
            ) : (
              <View className='w-20 h-20 rounded-full bg-secondary items-center justify-center mb-4'>
                <CircleUserRound size={40} color='#666' />
              </View>
            )}
            
            <H2 className='text-center mb-2'>
              {user.name || 'User'}
            </H2>
            
            <Text className='text-muted-foreground text-center'>
              {user.email}
            </Text>
          </View>
          
          <View className='gap-4'>
            <BottomSheetCloseTrigger asChild>
              <Button 
                variant='outline' 
                onPress={() => {
                  router.push('/profile');
                }}
              >
                <Text>Profile</Text>
              </Button>
            </BottomSheetCloseTrigger>
            
            <Button 
              variant='outline' 
              onPress={() => {
                Alert.alert('Coming Soon', 'Settings will be available soon');
              }}
            >
              <Text>Settings</Text>
            </Button>
            
            <Button 
              variant='destructive'
              onPress={handleSignOut}
            >
              <Text>Sign Out</Text>
            </Button>
          </View>
          
          <View className={cn(Platform.OS === 'android' && 'pb-2')}>
            <BottomSheetCloseTrigger asChild>
              <Button variant='ghost'>
                <Text>Close</Text>
              </Button>
            </BottomSheetCloseTrigger>
          </View>
        </BottomSheetView>
      </BottomSheetContent>
    </BottomSheet>
  );
} 