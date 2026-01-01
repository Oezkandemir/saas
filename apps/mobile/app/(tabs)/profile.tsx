import React, { useState, useEffect } from 'react';
import { View, Alert, Image } from 'react-native';
import { AppScrollView } from '~/components/ui/scroll-view';
import { Card, CardContent } from '~/components/ui/card';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { useAuth } from '~/lib/auth-context';
import { supabase } from '~/lib/supabase';
import { CircleUserRound } from '~/lib/icons/CircleUserRound';
import { Badge } from '~/components/ui/badge';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ name: profile.name })
        .eq('id', user.id);

      if (error) throw error;

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
      });
    }
    setIsEditing(false);
  };

  const hasChanges = () => {
    if (!user) return false;
    return profile.name !== (user.name || '');
  };

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">No user data available</Text>
      </View>
    );
  }

  return (
    <AppScrollView>
        <View className="p-6">
          {/* Profile Header */}
          <View className="mb-8 items-center">
            <View className="relative mb-4">
              {user.image ? (
                <Image
                  source={{ uri: user.image }}
                  className="h-20 w-20 rounded-full border border-border"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-20 w-20 items-center justify-center rounded-full border border-border bg-muted">
                  <CircleUserRound size={32} className="text-muted-foreground" />
                </View>
              )}
              
              {/* Online indicator */}
              <View className="absolute bottom-0 right-1 h-4 w-4 rounded-full border-2 border-background bg-green-500" />
            </View>
            
            <Text className="mb-1 text-xl font-semibold">
              {profile.name || 'User'}
            </Text>
            <Text className="mb-3 text-sm text-muted-foreground">
              {profile.email}
            </Text>
                         <Badge variant="secondary" className="border-blue-200 bg-blue-100 dark:border-blue-700 dark:bg-blue-900">
               <Text className="text-xs font-medium text-blue-800 dark:text-blue-100">Member</Text>
             </Badge>
          </View>

          {/* Profile Information */}
          <Card className="border-border/40 shadow-none">
            <CardContent className="p-6">
              <View className="gap-6">
                {/* Header with Edit Button */}
                <View className="mb-4 flex-row items-center justify-between">
                  <Text className="text-lg font-semibold text-foreground">
                    Profile Information
                  </Text>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => setIsEditing(true)}
                      className="border-blue-200 px-4 py-2 dark:border-blue-700"
                    >
                      <Text className="text-sm font-medium text-blue-600 dark:text-blue-400">Edit</Text>
                    </Button>
                  ) : (
                    <View className="flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={handleCancel}
                        disabled={loading}
                        className="border-gray-300 px-3 py-2 dark:border-gray-600"
                      >
                        <Text className="text-sm text-gray-600 dark:text-gray-400">Cancel</Text>
                      </Button>
                      <Button
                        size="sm"
                        onPress={handleSave}
                        disabled={loading || !hasChanges()}
                        className="bg-blue-600 px-4 py-2 dark:bg-blue-500"
                      >
                        <Text className="text-sm font-medium text-white">
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Text>
                      </Button>
                    </View>
                  )}
                </View>
                
                {/* Edit Mode Indicator */}
                {isEditing && (
                  <View className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/30">
                    <Text className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      ✏️ Edit Mode Active
                    </Text>
                    <Text className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      Make your changes and click "Save Changes" to update your profile
                    </Text>
                  </View>
                )}

                <View>
                  <Text className="mb-2 text-sm font-medium text-foreground">
                    Display Name
                  </Text>
                  {isEditing ? (
                    <View>
                      <Input
                        value={profile.name}
                        onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
                        placeholder="Enter your full name"
                        className="border-blue-200 bg-background focus:border-blue-500 dark:border-blue-700 dark:focus:border-blue-400"
                        autoFocus={false}
                      />
                      {profile.name !== (user?.name || '') && (
                        <Text className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                          ⚠️ Unsaved changes
                        </Text>
                      )}
                    </View>
                  ) : (
                    <View className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                      <Text className="text-foreground">
                        {profile.name || 'Not set'}
                      </Text>
                    </View>
                  )}
                </View>

                <View>
                  <Text className="mb-2 text-sm font-medium text-foreground">
                    Email Address
                  </Text>
                  <View className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                    <Text className="text-muted-foreground">
                      {profile.email}
                    </Text>
                  </View>
                  <Text className="mt-1 text-xs text-muted-foreground">
                    Email cannot be changed
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="mt-4 border-border/40 shadow-none">
            <CardContent className="p-6">
              <Text className="mb-4 text-sm font-medium text-foreground">
                Account Information
              </Text>
              
              <View className="gap-3">
                <View className="flex-row items-center justify-between py-1">
                  <Text className="text-sm text-muted-foreground">User ID</Text>
                  <Text className="rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
                    {user.id.slice(0, 8)}...
                  </Text>
                </View>
                
                <View className="flex-row items-center justify-between py-1">
                  <Text className="text-sm text-muted-foreground">Plan</Text>
                  <Badge variant="outline" className="border-border/60">
                    <Text className="text-xs">Free</Text>
                  </Badge>
                </View>
                
                <View className="flex-row items-center justify-between py-1">
                  <Text className="text-sm text-muted-foreground">Member Since</Text>
                  <Text className="text-sm text-foreground">Recently</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="mb-6 mt-6 border-red-200 shadow-none dark:border-red-800">
            <CardContent className="p-6">
              <Text className="mb-4 text-sm font-medium text-red-600 dark:text-red-400">
                Danger Zone
              </Text>
              
              <Button
                variant="destructive"
                className="w-full bg-red-600 dark:bg-red-700"
                onPress={() => {
                  Alert.alert(
                    'Delete Account',
                    'This action cannot be undone. All your data will be permanently deleted.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => Alert.alert('Feature Not Available', 'Account deletion is not implemented yet.'),
                      },
                    ]
                  );
                }}
              >
                <Text className="text-sm font-medium text-white">Delete Account</Text>
              </Button>
            </CardContent>
          </Card>
          
          {/* Bottom Spacer for Better Scroll Experience */}
          <View className="h-8" />
        </View>
      </AppScrollView>
  );
} 