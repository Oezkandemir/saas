import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { DeprecatedUi } from '@rnr/reusables';
import { Card, CardContent } from '~/components/ui/card';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { H3, Muted } from '~/components/ui/typography';
import { Separator } from '~/components/ui/separator';
import { useNotifications } from '~/lib/notification-provider';
import { useColorScheme } from '~/lib/useColorScheme';

const {
  BottomSheet,
  BottomSheetContent,
  BottomSheetOpenTrigger,
  BottomSheetHeader,
  BottomSheetView,
  BottomSheetCloseTrigger,
} = DeprecatedUi;

interface NotificationBottomSheetProps {
  children: React.ReactNode;
}

export function NotificationBottomSheet({ children }: NotificationBottomSheetProps) {
  const { notifications, loading, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const { isDarkColorScheme } = useColorScheme();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'WELCOME': return '#16a34a';
      case 'SYSTEM': return '#dc2626';
      case 'UPDATE': return '#d97706';
      case 'INFO': return '#2563eb';
      case 'NEWSLETTER': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationPress = async (notification: any) => {
    // Mark as read when pressed
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate if there's an action URL
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const handleViewAllNotifications = () => {
    router.push('/(tabs)/notifications');
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications.slice(0, 3); // Show only 3 most recent

  return (
    <BottomSheet>
      <BottomSheetOpenTrigger asChild>
        {children}
      </BottomSheetOpenTrigger>
      
      <BottomSheetContent>
        <BottomSheetHeader>
          <View className="flex-row items-center justify-between w-full">
            <H3>Notifications</H3>
            {unreadCount > 0 && (
              <Badge variant="default">
                <Text className="text-xs">{unreadCount} new</Text>
              </Badge>
            )}
          </View>
        </BottomSheetHeader>
        
        <BottomSheetView className="gap-4 pt-4">

          {/* Quick Actions */}
          {notifications.length > 0 && (
            <View className="flex-row gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onPress={markAllAsRead} 
                className="flex-1"
                disabled={unreadCount === 0}
              >
                <Text>Mark all read</Text>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onPress={clearAll} 
                className="flex-1"
              >
                <Text>Clear all</Text>
              </Button>
            </View>
          )}

          <Separator />

          {/* Notifications List */}
          <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
            {loading ? (
              <View className="items-center py-8">
                <Text className="text-muted-foreground">Loading...</Text>
              </View>
            ) : notifications.length === 0 ? (
              <View className="items-center py-8">
                <Text className="text-muted-foreground text-center">
                  No notifications yet
                </Text>
                <Muted className="text-center mt-2">
                  You'll see important updates here
                </Muted>
              </View>
            ) : (
              <View className="gap-3">
                {recentNotifications.map((notification) => (
                  <Pressable 
                    key={notification.id}
                    onPress={() => handleNotificationPress(notification)}
                  >
                    <Card className={`${!notification.read ? 'bg-primary/5 border-primary/20' : ''}`}>
                      <CardContent className="p-3">
                        <View className="flex-row items-start gap-3">
                          {/* Unread indicator */}
                          {!notification.read && (
                            <View className="w-2 h-2 rounded-full bg-primary mt-2" />
                          )}
                          
                          <View className="flex-1">
                            {/* Title and Type */}
                            <View className="flex-row items-center gap-2 mb-2">
                              <Text className="font-semibold text-foreground flex-1 text-sm">
                                {notification.title}
                              </Text>
                              
                              <Badge 
                                style={{ backgroundColor: getTypeColor(notification.type) }}
                              >
                                <Text className="text-white text-xs">
                                  {notification.type}
                                </Text>
                              </Badge>
                            </View>
                            
                            {/* Content */}
                            <Text className="text-xs text-muted-foreground mb-2" numberOfLines={2}>
                              {notification.content}
                            </Text>
                            
                            {/* Footer */}
                            <View className="flex-row items-center justify-between">
                              <Muted className="text-xs">
                                {formatDate(notification.created_at)}
                              </Muted>
                              
                              {!notification.read && (
                                <Pressable 
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="px-2 py-1 rounded bg-primary/10"
                                >
                                  <Text className="text-xs text-primary">Mark read</Text>
                                </Pressable>
                              )}
                            </View>
                          </View>
                        </View>
                      </CardContent>
                    </Card>
                  </Pressable>
                ))}
                
                {notifications.length > 3 && (
                  <View className="mt-2">
                    <Text className="text-center text-muted-foreground text-xs">
                      +{notifications.length - 3} more notifications
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* View All Button */}
          {notifications.length > 0 && (
            <View className="pt-2">
              <BottomSheetCloseTrigger asChild>
                <Button onPress={handleViewAllNotifications} className="w-full">
                  <Text>View All Notifications</Text>
                </Button>
              </BottomSheetCloseTrigger>
            </View>
          )}
          
          <View className="pt-4">
            <BottomSheetCloseTrigger asChild>
              <Button variant="ghost">
                <Text>Close</Text>
              </Button>
            </BottomSheetCloseTrigger>
          </View>
        </BottomSheetView>
      </BottomSheetContent>
    </BottomSheet>
  );
} 