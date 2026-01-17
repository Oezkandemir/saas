/**
 * Browser Push Notification Service
 * Handles browser push notification registration, permission requests, and sending notifications
 */

export interface PushNotificationPermission {
  state: NotificationPermission;
  granted: boolean;
  denied: boolean;
  default: boolean;
}

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: Record<string, any>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  url?: string;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;
  private permissionState: NotificationPermission = 'default';

  constructor() {
    this.isSupported = this.checkSupport();
    if (this.isSupported) {
      this.permissionState = Notification.permission;
      this.initializeServiceWorker();
    }
  }

  /**
   * Check if browser supports push notifications
   */
  private checkSupport(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  }

  /**
   * Initialize service worker registration
   */
  private async initializeServiceWorker(): Promise<void> {
    if (!this.isSupported) {
      console.warn('[PushNotifications] Browser does not support push notifications');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('[PushNotifications] Service Worker registered:', this.registration.scope);
    } catch (error) {
      console.error('[PushNotifications] Service Worker registration failed:', error);
    }
  }

  /**
   * Get current permission state
   */
  getPermission(): PushNotificationPermission {
    if (!this.isSupported) {
      return {
        state: 'denied',
        granted: false,
        denied: true,
        default: false,
      };
    }

    const state = Notification.permission;
    return {
      state,
      granted: state === 'granted',
      denied: state === 'denied',
      default: state === 'default',
    };
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<PushNotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Browser does not support push notifications');
    }

    if (Notification.permission === 'granted') {
      return this.getPermission();
    }

    if (Notification.permission === 'denied') {
      throw new Error('Notification permission has been denied. Please enable it in your browser settings.');
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionState = permission;
      return this.getPermission();
    } catch (error) {
      console.error('[PushNotifications] Error requesting permission:', error);
      throw error;
    }
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return this.isSupported && this.getPermission().granted;
  }

  /**
   * Send a browser push notification
   */
  async sendNotification(options: PushNotificationOptions): Promise<void> {
    if (!this.isSupported) {
      console.warn('[PushNotifications] Browser does not support push notifications');
      return;
    }

    const permission = this.getPermission();
    if (!permission.granted) {
      console.warn('[PushNotifications] Permission not granted');
      return;
    }

    // Ensure service worker is registered
    if (!this.registration) {
      await this.initializeServiceWorker();
    }

    if (!this.registration) {
      console.error('[PushNotifications] Service Worker not available');
      return;
    }

    try {
      // Use Service Worker API for better control
      await this.registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/vite.svg',
        badge: options.badge || '/vite.svg',
        tag: options.tag || 'notification',
        requireInteraction: options.requireInteraction || false,
        data: {
          ...options.data,
          url: options.url,
          action_url: options.url,
        },
        actions: options.actions || [
          {
            action: 'view',
            title: 'View',
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
          },
        ],
        vibrate: [200, 100, 200],
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('[PushNotifications] Error showing notification:', error);
      // Fallback to direct Notification API if Service Worker fails
      if (Notification.permission === 'granted') {
        new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/vite.svg',
          tag: options.tag || 'notification',
          data: options.data,
        });
      }
    }
  }

  /**
   * Send notification from notification data
   */
  async sendNotificationFromData(notification: {
    id: string;
    title: string;
    content: string;
    type?: string;
    action_url?: string;
    created_at?: string;
  }): Promise<void> {
    const iconMap: Record<string, string> = {
      SYSTEM: '/vite.svg',
      SECURITY: '/vite.svg',
      SUPPORT: '/vite.svg',
      WELCOME: '/vite.svg',
      USER: '/vite.svg',
      MAIL: '/vite.svg',
      EMAIL: '/vite.svg',
    };

    await this.sendNotification({
      title: notification.title,
      body: notification.content,
      icon: iconMap[notification.type || ''] || '/vite.svg',
      tag: notification.id,
      data: {
        id: notification.id,
        type: notification.type,
        url: notification.action_url,
      },
      url: notification.action_url || '/notifications',
    });
  }
}

// Singleton instance
let pushNotificationService: PushNotificationService | null = null;

export function getPushNotificationService(): PushNotificationService {
  if (!pushNotificationService) {
    pushNotificationService = new PushNotificationService();
  }
  return pushNotificationService;
}

export default getPushNotificationService;
