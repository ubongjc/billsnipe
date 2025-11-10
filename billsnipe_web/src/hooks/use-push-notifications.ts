'use client'

import { useEffect, useState } from 'react'
import {
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  sendPushSubscriptionToServer,
} from '@/lib/push-notifications'

interface UsePushNotificationsReturn {
  isSupported: boolean
  permission: NotificationPermission | null
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if notifications are supported
    const supported =
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window

    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)

      // Check if already subscribed
      checkSubscriptionStatus()
    } else {
      setIsLoading(false)
    }
  }, [])

  const checkSubscriptionStatus = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      }
    } catch (err) {
      console.error('Failed to check subscription status:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const subscribe = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Request permission
      const permissionResult = await requestNotificationPermission()
      setPermission(permissionResult)

      if (permissionResult !== 'granted') {
        setError('Notification permission denied')
        return
      }

      // Subscribe to push notifications
      const subscription = await subscribeToPushNotifications()

      if (!subscription) {
        setError('Failed to subscribe to push notifications')
        return
      }

      // Send subscription to server
      const success = await sendPushSubscriptionToServer(subscription)

      if (success) {
        setIsSubscribed(true)
      } else {
        setError('Failed to register subscription with server')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribe = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const success = await unsubscribeFromPushNotifications()

      if (success) {
        setIsSubscribed(false)

        // Notify server
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      } else {
        setError('Failed to unsubscribe')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  }
}
