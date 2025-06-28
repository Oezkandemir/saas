import React from 'react';
import { View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Card, CardContent } from '~/components/ui/card';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { H1, Muted } from '~/components/ui/typography';
import { Separator } from '~/components/ui/separator';
import { AppHeader } from '~/components/layout/AppHeader';
import { useNotifications } from '~/lib/notification-provider';

export default function NotificationsScreen() {
  const { 
    notifications, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAll,
    refresh 
  } = useNotifications();

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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View className="flex-1 bg-background">
      <AppHeader 
        title="Notifications" 
        showBackButton={true}
        showNotifications={false}
        showLogo={false}
      />
      
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        <View className="p-6 gap-6">
          {/* Header Stats */}
          <View className="gap-2">
            <H1>All Notifications</H1>
            <View className="flex-row items-center gap-4">
              <Muted>
                {notifications.length} total • {unreadCount} unread
              </Muted>
              {unreadCount > 0 && (
                <Badge variant="default">
                  <Text className="text-xs">{unreadCount} new</Text>
                </Badge>
              )}
            </View>
          </View>

          {/* Quick Actions */}
          {notifications.length > 0 && (
            <View className="gap-4">
              <View className="flex-row gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onPress={markAllAsRead}
                  className="flex-1"
                  disabled={unreadCount === 0}
                >
                  <Text>Mark All Read ({unreadCount})</Text>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onPress={clearAll}
                  className="flex-1"
                >
                  <Text>Clear All</Text>
                </Button>
              </View>
            </View>
          )}

          <Separator />

          {/* Notifications List */}
          {loading ? (
            <View className="items-center py-12">
              <Text className="text-muted-foreground">Loading notifications...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-muted-foreground text-center text-lg">
                No notifications yet
              </Text>
              <Muted className="text-center mt-2">
                You'll see important updates and messages here
              </Muted>
              <Button 
                onPress={() => router.back()}
                variant="outline" 
                className="mt-6"
              >
                <Text>Go Back</Text>
              </Button>
            </View>
          ) : (
            <View className="gap-4">
              {notifications.map((notification) => (
                <Pressable 
                  key={notification.id}
                  onPress={() => handleNotificationPress(notification)}
                >
                  <Card className={`${!notification.read ? 'bg-primary/5 border-primary/20' : ''}`}>
                    <CardContent className="p-5">
                      <View className="flex-row items-start gap-4">
                        {/* Unread indicator */}
                        <View className="pt-1">
                          {!notification.read ? (
                            <View className="w-3 h-3 rounded-full bg-primary" />
                          ) : (
                            <View className="w-3 h-3 rounded-full bg-muted" />
                          )}
                        </View>
                        
                        <View className="flex-1">
                          {/* Title and Type */}
                          <View className="flex-row items-center gap-2 mb-3">
                            <Text className="font-semibold text-foreground flex-1 text-base">
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
                          <Text className="text-muted-foreground mb-4 leading-6">
                            {notification.content}
                          </Text>
                          
                          {/* Footer */}
                          <View className="flex-row items-center justify-between">
                            <Muted className="text-sm">
                              {formatDate(notification.created_at)}
                            </Muted>
                            
                            <View className="flex-row gap-3">
                              {!notification.read && (
                                <Pressable 
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="px-3 py-1 rounded bg-primary/10"
                                >
                                  <Text className="text-sm text-primary font-medium">
                                    Mark Read
                                  </Text>
                                </Pressable>
                              )}
                              
                              <Pressable 
                                onPress={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="px-3 py-1 rounded bg-red-50"
                              >
                                <Text className="text-sm text-red-600 font-medium">
                                  Delete
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                          
                          {/* Action URL indicator */}
                          {notification.action_url && (
                            <View className="mt-3 pt-3 border-t border-border">
                              <Text className="text-xs text-primary">
                                → Tap to view details
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <View className="items-center py-6">
              <Muted className="text-center">
                You're all caught up! 🎉
              </Muted>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
} 