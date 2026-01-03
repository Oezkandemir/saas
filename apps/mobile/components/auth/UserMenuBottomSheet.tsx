import React from 'react';
import { View, Image, Alert } from 'react-native';
import { DeprecatedUi } from '@rnr/reusables';
import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { Button } from '../ui/button';
import { Text } from '../ui/text';
import { useAuth } from '~/lib/auth-context';
import { CircleUserRound } from '~/lib/icons/CircleUserRound';

const {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetView,
} = DeprecatedUi;

interface UserMenuBottomSheetProps {
  children: React.ReactNode;
}

export function UserMenuBottomSheet({ children }: UserMenuBottomSheetProps) {
  const { user, signOut } = useAuth();
  const { dismiss } = useBottomSheetModal();

  const handleSignOut = async () => {
    dismiss(); // Close sheet instantly
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
      <BottomSheetContent enablePanDownToClose={true}>
        <BottomSheetHeader>
          <View />
        </BottomSheetHeader>
        <BottomSheetView className='gap-2 pt-2'>
          {/* User Context */}
          <View className='flex-row items-center gap-2 px-1 py-1'>
            {user.image ? (
              <Image
                source={{ uri: user.image }}
                className='w-10 h-10 rounded-full'
                resizeMode='cover'
              />
            ) : (
              <View className='w-10 h-10 rounded-full bg-secondary items-center justify-center'>
                <CircleUserRound size={20} color='#666' />
              </View>
            )}
            <Text className='text-sm font-medium flex-1'>
              {user.name || 'User'}
            </Text>
          </View>

          {/* Quick Action */}
          <Button 
            variant='destructive'
            onPress={handleSignOut}
            className='h-11'
          >
            <Text className='text-sm font-medium'>Sign Out</Text>
          </Button>
        </BottomSheetView>
      </BottomSheetContent>
    </BottomSheet>
  );
} 