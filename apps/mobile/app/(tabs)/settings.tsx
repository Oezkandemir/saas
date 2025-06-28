import React, { useState } from 'react';
import { View, Alert, Image } from 'react-native';
import { AppScrollView } from '~/components/ui/scroll-view';
import { router } from 'expo-router';
import { Card, CardHeader, CardTitle, CardContent } from '~/components/ui/card';
import { Text } from '~/components/ui/text';
import { H1, H2, Muted } from '~/components/ui/typography';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Switch } from '~/components/ui/switch';
import { Separator } from '~/components/ui/separator';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '~/components/ui/accordion';
import { ChevronDown } from '~/lib/icons/ChevronDown';
import { useAuth } from '~/lib/auth-context';
import { useColorScheme } from '~/lib/useColorScheme';
import { supabase } from '~/lib/supabase';
import { notificationService } from '~/lib/notification-service';
import { cn } from '~/lib/utils';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { isDarkColorScheme, setColorScheme } = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    notifications: true,
    analytics: true,
    newsletter: false,
  });

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/welcome');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Feature Not Available', 'Account deletion is not implemented yet.');
          },
        },
      ]
    );
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: profile.name,
        })
        .eq('id', user?.id);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const testRealTimeNotifications = async () => {
    try {
      const success = await notificationService.createTestNotification();
      if (success) {
        Alert.alert(
          'Success!', 
          'Test notification created! It should appear instantly in the header bell if real-time is working.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Table Missing', 
          'The user_notifications table does not exist. Check the console for SQL to create it.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error testing real-time notifications:', error);
      Alert.alert('Error', 'Failed to test real-time notifications');
    }
  };

  const handleDarkModeToggle = (checked: boolean) => {
    setColorScheme(checked ? 'dark' : 'light');
  };

  const userName = user?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const memberSince = 'Recently'; // Would need to fetch from user_profiles table for actual date

  return (
    <AppScrollView>
      <View className="gap-6 p-6">
        {/* Header */}
        <View className="gap-2">
          <H1>Settings</H1>
          <Muted>Manage your account and app preferences</Muted>
        </View>

        {/* Profile Section with Accordion */}
        <View className="overflow-hidden rounded-xl border border-border bg-card">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="profile" className="border-0">
              <AccordionTrigger className="border-0 px-6 py-4">
                <View className="flex-1 flex-row items-center gap-3">
                  {/* User Avatar */}
                  <View className={cn(
                    "w-12 h-12 rounded-full items-center justify-center overflow-hidden border",
                    isDarkColorScheme 
                      ? "bg-white border-gray-200" 
                      : "bg-gray-100 border-gray-300"
                  )}>
                    {user?.image ? (
                      <Image
                        source={{ uri: user.image }}
                        className="h-12 w-12 rounded-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Text className={cn(
                        "text-lg font-bold",
                        isDarkColorScheme ? "text-black" : "text-gray-700"
                      )}>
                        {userName.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  
                  {/* User Info */}
                  <View className="flex-1">
                    <Text className="text-left font-semibold">{userName}</Text>
                    <Text className="text-left text-sm text-muted-foreground">{userEmail}</Text>
                  </View>
                  
                  {/* Modern Interactive Icon */}
                  <View className={cn(
                    "w-7 h-7 rounded-xl items-center justify-center shadow-lg border",
                    isDarkColorScheme 
                      ? "bg-white border-gray-200" 
                      : "bg-black border-gray-800"
                  )}>
                    <ChevronDown 
                      size={14} 
                      className={isDarkColorScheme ? "text-black" : "text-white"} 
                    />
                  </View>
                </View>
              </AccordionTrigger>
              
              <AccordionContent className="px-6 pb-6">
                <View className="gap-4">
                  <View className="mb-4 items-center gap-4">
                    <View className={cn(
                      "w-20 h-20 rounded-full items-center justify-center overflow-hidden border",
                      isDarkColorScheme 
                        ? "bg-white border-gray-200" 
                        : "bg-gray-100 border-gray-300"
                    )}>
                      {user?.image ? (
                        <Image
                          source={{ uri: user.image }}
                          className="h-20 w-20 rounded-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <Text className={cn(
                          "text-2xl font-bold",
                          isDarkColorScheme ? "text-black" : "text-gray-700"
                        )}>
                          {userName.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    
                    <View className="items-center">
                      <Text className="text-lg font-semibold">{userName}</Text>
                      <Text className="text-muted-foreground">{userEmail}</Text>
                      <Badge variant="secondary" className="mt-1">
                        <Text className="text-xs">Member since {memberSince}</Text>
                      </Badge>
                    </View>
                  </View>

                  <Separator />

                  <View className="gap-3">
                    <View className="gap-2">
                      <Text className="font-medium">Full Name</Text>
                      <Input
                        value={profile.name}
                        onChangeText={(text) => setProfile({ ...profile, name: text })}
                        placeholder="Enter your full name"
                      />
                    </View>

                    <View className="gap-2">
                      <Text className="font-medium">Email Address</Text>
                      <Input
                        value={profile.email}
                        editable={false}
                        className="opacity-50"
                      />
                      <Muted className="text-xs">Email cannot be changed</Muted>
                    </View>

                    <Button 
                      onPress={updateProfile}
                      disabled={loading}
                      className="mt-2"
                    >
                      <Text>{loading ? 'Updating...' : 'Update Profile'}</Text>
                    </Button>
                  </View>
                </View>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </View>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>App Preferences</CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            {/* Dark Mode Toggle - First priority */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-medium">Dark Mode</Text>
                <Muted className="text-sm">
                  {isDarkColorScheme ? 'Using dark theme' : 'Using light theme'}
                </Muted>
              </View>
              <Switch
                checked={isDarkColorScheme}
                onCheckedChange={handleDarkModeToggle}
              />
            </View>

            <Separator />

            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-medium">Push Notifications</Text>
                <Muted className="text-sm">Receive app notifications</Muted>
              </View>
              <Switch
                checked={profile.notifications}
                onCheckedChange={(checked) => 
                  setProfile({ ...profile, notifications: checked })
                }
              />
            </View>

            <Separator />

            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-medium">Analytics</Text>
                <Muted className="text-sm">Help improve the app</Muted>
              </View>
              <Switch
                checked={profile.analytics}
                onCheckedChange={(checked) => 
                  setProfile({ ...profile, analytics: checked })
                }
              />
            </View>

            <Separator />

            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-medium">Newsletter</Text>
                <Muted className="text-sm">Receive product updates</Muted>
              </View>
              <Switch
                checked={profile.newsletter}
                onCheckedChange={(checked) => 
                  setProfile({ ...profile, newsletter: checked })
                }
              />
            </View>
          </CardContent>
        </Card>

        {/* Account Management */}
        <Card>
          <CardHeader>
            <CardTitle>Account Management</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <Button variant="outline" className="w-full justify-start">
              <Text>🔒 Change Password</Text>
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Text>📧 Update Email</Text>
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Text>📱 Manage Devices</Text>
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Text>📊 Download My Data</Text>
            </Button>
          </CardContent>
        </Card>

        {/* Support & Info */}
        <Card>
          <CardHeader>
            <CardTitle>Support & Information</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <Button variant="outline" className="w-full justify-start">
              <Text>❓ Help Center</Text>
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Text>📝 Terms of Service</Text>
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Text>🔐 Privacy Policy</Text>
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Text>📞 Contact Support</Text>
            </Button>
            
            <Separator />
            
            <Button 
              variant="outline" 
              className="w-full justify-start border-orange-200" 
              onPress={testRealTimeNotifications}
            >
              <Text className="text-orange-600">🧪 Test Real-Time Notifications</Text>
            </Button>
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-medium">Current Plan</Text>
                <Muted className="text-sm">Premium Plan</Muted>
              </View>
              <Badge variant="default">
                <Text className="text-xs">Active</Text>
              </Badge>
            </View>
            
            <Separator />
            
            <View className="gap-3">
              <Button 
                variant="outline" 
                className="w-full"
                onPress={() => router.push('/(tabs)/billing')}
              >
                <Text>💳 Manage Billing</Text>
              </Button>
              
              <Button variant="outline" className="w-full">
                <Text>📈 Upgrade Plan</Text>
              </Button>
            </View>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <Button 
              variant="outline" 
              onPress={handleSignOut}
              className="w-full border-red-200"
            >
              <Text className="text-red-600">🚪 Sign Out</Text>
            </Button>
            
            <Button 
              variant="outline" 
              onPress={handleDeleteAccount}
              className="w-full border-red-200"
            >
              <Text className="text-red-600">🗑️ Delete Account</Text>
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="items-center p-4">
            <Text className="text-sm text-muted-foreground">
              Cenety Mobile App v1.0.0
            </Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              Built with React Native & Expo
            </Text>
          </CardContent>
        </Card>
      </View>
    </AppScrollView>
  );
} 