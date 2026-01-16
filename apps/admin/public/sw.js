// Service Worker for Browser Push Notifications
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  
  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: 'notification',
    requireInteraction: false,
    data: {}
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || data.content || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || data.id || notificationData.tag,
        requireInteraction: data.requireInteraction || false,
        data: data.data || {},
        actions: data.actions || []
      };
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
      const text = event.data.text();
      if (text) {
        notificationData.body = text;
      }
    }
  }

  const promiseChain = self.registration.showNotification(notificationData.title, {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
    data: notificationData.data,
    actions: notificationData.actions,
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  });

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received.');
  
  event.notification.close();

  const notificationData = event.notification.data || {};
  const action = event.action;
  
  // Handle action clicks
  if (action === 'view') {
    const url = notificationData.url || '/notifications';
    event.waitUntil(
      clients.openWindow(url)
    );
  } else if (action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default: open the notification URL or notifications page
    const url = notificationData.url || notificationData.action_url || '/notifications';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification closed.');
});
