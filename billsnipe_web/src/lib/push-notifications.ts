/**
 * Web Push Notifications Service
 * Handles push notification subscriptions and delivery
 */

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported')
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission()
  }

  return Notification.permission
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      // Subscribe to push notifications
      // In production, you would use your VAPID public key here
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

      if (!vapidPublicKey) {
        console.warn('VAPID public key not configured')
        return null
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })
    }

    return subscription
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error)
    return null
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      return true
    }

    return false
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error)
    return false
  }
}

export async function sendPushSubscriptionToServer(
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    })

    return response.ok
  } catch (error) {
    console.error('Failed to send subscription to server:', error)
    return false
  }
}

export function showLocalNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) {
    return
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    })
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

// Notification templates
export const NotificationTemplates = {
  highUsage: (kWh: number) => ({
    title: '⚡ High Usage Alert',
    body: `Your current usage (${kWh.toFixed(1)} kWh) is higher than normal. Consider reducing non-essential loads.`,
    tag: 'high-usage',
    requireInteraction: true,
  }),

  savingsOpportunity: (amount: number) => ({
    title: '💰 Savings Opportunity',
    body: `Switch to a recommended plan and save up to $${amount.toFixed(2)} per month!`,
    tag: 'savings',
    data: { url: '/plans' },
  }),

  billReady: (amount: number) => ({
    title: '📄 Bill Ready',
    body: `Your estimated bill is $${amount.toFixed(2)}. View details now.`,
    tag: 'bill-ready',
    data: { url: '/reports' },
  }),

  planSwitchComplete: (provider: string) => ({
    title: '✅ Plan Switch Complete',
    body: `Successfully switched to ${provider}. Start saving today!`,
    tag: 'plan-switch',
  }),
}
