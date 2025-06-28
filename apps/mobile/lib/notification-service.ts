import { supabase } from './supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'WELCOME' | 'NEWSLETTER' | 'SYSTEM' | 'UPDATE' | 'INFO';
  read: boolean;
  created_at: string;
  action_url?: string | null;
  metadata?: any;
}

export interface NotificationCount {
  total: number;
  unread: number;
}

class NotificationService {
  private listeners: Set<(notifications: Notification[]) => void> = new Set();
  private countListeners: Set<(count: NotificationCount) => void> = new Set();
  private subscription: any = null;
  private isInitialized = false;

  /**
   * Generate mock notifications based on current user state
   */
  private async generateMockNotifications(userId: string): Promise<Notification[]> {
    try {
      // Try to get user profile to determine role-based notifications
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role, name')
        .eq('id', userId)
        .single();

      const userRole = userProfile?.role || 'user';
      const userName = userProfile?.name || 'User';

      // Generate notifications based on user role
      const baseNotifications: Notification[] = [
        {
          id: '1',
          user_id: userId,
          title: 'Welcome to Cenety!',
          content: `Hi ${userName}! Thank you for joining our platform. Get started by exploring your dashboard.`,
          type: 'WELCOME',
          read: false,
          created_at: new Date().toISOString(),
          action_url: null,
          metadata: { role: userRole },
        },
        {
          id: '2',
          user_id: userId,
          title: 'System Update',
          content: 'We have released a new version with improved performance and bug fixes.',
          type: 'SYSTEM',
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          action_url: null,
          metadata: { role: userRole },
        },
      ];

      // Add role-specific notifications
      if (userRole === 'admin') {
        baseNotifications.push({
          id: '3',
          user_id: userId,
          title: 'Admin Alert',
          content: 'New admin features are available. Check the admin panel for more details.',
          type: 'SYSTEM',
          read: false,
          created_at: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
          action_url: '/admin',
          metadata: { role: userRole },
        });
        baseNotifications.push({
          id: '4',
          user_id: userId,
          title: 'User Management',
          content: 'You have new permissions to manage user accounts.',
          type: 'INFO',
          read: true,
          created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          action_url: '/users',
          metadata: { role: userRole },
        });
      } else {
        baseNotifications.push({
          id: '3',
          user_id: userId,
          title: 'New Analytics Available',
          content: 'Your monthly analytics report is now ready to view.',
          type: 'INFO',
          read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          action_url: '/analytics',
          metadata: { role: userRole },
        });
      }

      return baseNotifications;
    } catch (error) {
      console.log('Error generating role-based notifications, using defaults:', error);
      
      // Fallback to basic notifications
      return [
        {
          id: '1',
          user_id: userId,
          title: 'Welcome to Cenety!',
          content: 'Thank you for joining our platform. Get started by exploring your dashboard.',
          type: 'WELCOME',
          read: false,
          created_at: new Date().toISOString(),
          action_url: null,
          metadata: null,
        },
      ];
    }
  }

  /**
   * Fetch all notifications for the current user
   */
  async fetchNotifications(): Promise<Notification[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        return [];
      }

      // For demo purposes, return mock notifications if no table exists
      // In production, this would query a real notifications table
      const mockNotifications: Notification[] = await this.generateMockNotifications(user.id);

      // Try to fetch from real table, fallback to mock data
      try {
        const { data, error } = await supabase
          .from('user_notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error && error.code !== 'PGRST116') { // PGRST116 = table not found
          console.error('Error fetching notifications:', error);
          return mockNotifications;
        }

        return data && data.length > 0 ? data : mockNotifications;
      } catch (error) {
        console.log('Using mock notifications data');
        return mockNotifications;
      }
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
      return [];
    }
  }

  /**
   * Get notification count (total and unread)
   */
  async getNotificationCount(): Promise<NotificationCount> {
    try {
      const notifications = await this.fetchNotifications();
      const total = notifications.length;
      const unread = notifications.filter(n => !n.read).length;

      return { total, unread };
    } catch (error) {
      console.error('Error in getNotificationCount:', error);
      return { total: 0, unread: 0 };
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Try to update in database, fallback to mock behavior
      try {
        const { error } = await supabase
          .from('user_notifications')
          .update({ read: true })
          .eq('id', notificationId)
          .eq('user_id', user.id);

        if (error && error.code !== 'PGRST116') {
          console.error('Error updating notification:', error);
        }
      } catch (error) {
        console.log('Database update failed, using mock behavior');
      }

      // Always trigger listeners to update UI
      await this.notifyListeners();
      await this.notifyCountListeners();
      return true;
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Try to update in database, fallback to mock behavior
      try {
        const { error } = await supabase
          .from('user_notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false);

        if (error && error.code !== 'PGRST116') {
          console.error('Error updating notifications:', error);
        }
      } catch (error) {
        console.log('Database update failed, using mock behavior');
      }

      // Always trigger listeners to update UI
      await this.notifyListeners();
      await this.notifyCountListeners();
      return true;
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return false;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      // In production, delete from database
      // For now, we'll just trigger listeners
      await this.notifyListeners();
      await this.notifyCountListeners();
      return true;
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      return false;
    }
  }

  /**
   * Clear all notifications for the current user
   */
  async clearAllNotifications(): Promise<boolean> {
    try {
      // In production, delete from database
      // For now, we'll just trigger listeners
      await this.notifyListeners();
      await this.notifyCountListeners();
      return true;
    } catch (error) {
      console.error('Error in clearAllNotifications:', error);
      return false;
    }
  }

  /**
   * Subscribe to notification updates
   */
  onNotificationsChange(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately fetch and call with current data
    this.fetchNotifications().then(callback);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Subscribe to notification count updates
   */
  onNotificationCountChange(callback: (count: NotificationCount) => void): () => void {
    this.countListeners.add(callback);
    
    // Immediately fetch and call with current data
    this.getNotificationCount().then(callback);
    
    return () => {
      this.countListeners.delete(callback);
    };
  }

  /**
   * Notify all notification listeners
   */
  private async notifyListeners(): Promise<void> {
    if (this.listeners.size > 0) {
      const notifications = await this.fetchNotifications();
      this.listeners.forEach(callback => callback(notifications));
    }
  }

  /**
   * Notify all count listeners
   */
  private async notifyCountListeners(): Promise<void> {
    if (this.countListeners.size > 0) {
      const count = await this.getNotificationCount();
      this.countListeners.forEach(callback => callback(count));
    }
  }

  /**
   * Subscribe to real-time notification updates
   */
  async subscribeToNotifications(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user, skipping real-time subscription');
        return;
      }

      // Clean up existing subscription
      this.unsubscribeFromNotifications();

      console.log('🔔 Setting up real-time notification subscription for user:', user.id);

      this.subscription = supabase
        .channel('user_notifications_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('🚀 Received notification change:', payload);
            // Refresh all listeners when data changes
            this.notifyListeners();
            this.notifyCountListeners();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE', // Listen to user profile updates
            schema: 'public',
            table: 'user_profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            console.log('👤 Real-time user profile update:', payload);
            this.handleUserProfileUpdate(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to real-time notifications');
          } else if (status === 'CLOSED') {
            console.log('❌ Real-time subscription closed');
          } else if (status === 'CHANNEL_ERROR') {
            console.log('🚨 Real-time subscription error');
          } else {
            console.log('📡 Notification subscription status:', status);
          }
        });
    } catch (error) {
      console.error('💥 Error subscribing to notifications:', error);
    }
  }

  /**
   * Unsubscribe from real-time notification updates
   */
  unsubscribeFromNotifications(): void {
    if (this.subscription) {
      console.log('Unsubscribing from notification updates');
      supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Notification service already initialized');
      return;
    }
    
    await this.subscribeToNotifications();
    this.isInitialized = true;
    console.log('Notification service initialized');
  }

  /**
   * Handle real-time updates from Supabase
   */
  private async handleRealtimeUpdate(payload: any): Promise<void> {
    console.log('Handling real-time update:', payload);
    
    // Refresh notifications and notify all listeners
    await this.notifyListeners();
    await this.notifyCountListeners();
  }

  /**
   * Handle real-time user profile updates
   */
  private async handleUserProfileUpdate(payload: any): Promise<void> {
    console.log('Handling user profile update:', payload);
    
    // When user profile changes (including role), refresh notifications
    // This will trigger mock notification generation based on new user state
    await this.notifyListeners();
    await this.notifyCountListeners();
  }

  /**
   * Create the user_notifications table if it doesn't exist
   */
  async createNotificationsTable(): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('create_notifications_table');
      
      if (error) {
        console.log('Creating notifications table manually...');
        
        // Try to create table manually with SQL
        const { error: sqlError } = await supabase.from('user_notifications').select('id').limit(1);
        
        if (sqlError && sqlError.code === 'PGRST116') {
          console.log('📋 user_notifications table does not exist. Please create it in Supabase dashboard.');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error creating notifications table:', error);
      return false;
    }
  }

  /**
   * Create a test notification (for development/testing)
   */
  async createTestNotification(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user found for test notification');
        return false;
      }

      console.log('🧪 Creating test notification for user:', user.id);

      const testNotification = {
        user_id: user.id,
        title: 'Real-Time Test',
        content: `Test notification created at ${new Date().toLocaleTimeString()} - This should appear instantly!`,
        type: 'INFO' as const,
        read: false,
        action_url: null,
        metadata: { test: true, timestamp: Date.now() },
      };

      // Try to insert into database
      const { data, error } = await supabase
        .from('user_notifications')
        .insert([testNotification])
        .select('*');

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('📋 user_notifications table does not exist.');
          console.log('🔧 Please create the table in Supabase with the following SQL:');
          console.log(`
CREATE TABLE user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('WELCOME', 'NEWSLETTER', 'SYSTEM', 'UPDATE', 'INFO')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action_url TEXT,
  metadata JSONB
);

-- Enable RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own notifications
CREATE POLICY "Users can view own notifications" ON user_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE user_notifications;
          `);
          return false;
        }
        
        console.error('💥 Error creating test notification:', error);
        return false;
      }

      console.log('✅ Test notification created successfully:', data);
      return true;
    } catch (error) {
      console.error('💥 Error in createTestNotification:', error);
      return false;
    }
  }

  /**
   * Cleanup the service
   */
  cleanup(): void {
    this.unsubscribeFromNotifications();
    this.listeners.clear();
    this.countListeners.clear();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Auto-initialize when imported
notificationService.initialize(); 