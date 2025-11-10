'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { UserProfile } from '@clerk/nextjs'
import { ThemeSelect } from '@/components/theme-toggle'
import { usePushNotifications } from '@/hooks/use-push-notifications'

interface SettingsClientProps {
  user: {
    id: string
    email: string
    role: string
    accountsCount: number
    createdAt: string
  }
  clerkUser: {
    firstName: string | null
    lastName: string | null
    imageUrl: string
  }
}

export function SettingsClient({ user, clerkUser }: SettingsClientProps) {
  const [isExporting, setIsExporting] = useState(false)
  const pushNotifications = usePushNotifications()

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Data export request submitted! You will receive an email shortly.')
    } catch (error) {
      toast.error('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = () => {
    toast.error('Account deletion requires confirmation via email. Contact support for assistance.')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <UserProfile
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-0"
                  }
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>View your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-3 border-b">
                <span className="text-sm font-medium">Email</span>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-sm font-medium">Role</span>
                <span className="text-sm text-muted-foreground">{user.role}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-sm font-medium">Connected Accounts</span>
                <span className="text-sm text-muted-foreground">{user.accountsCount}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-sm font-medium">Member Since</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Privacy & Data</CardTitle>
              <CardDescription>Manage your data and privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="text-sm font-medium">Export Your Data</p>
                  <p className="text-xs text-muted-foreground">Download all your data in JSON format</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  disabled={isExporting}
                >
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-destructive">Delete Account</p>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Theme</p>
                  <p className="text-xs text-muted-foreground">Choose your preferred theme</p>
                </div>
                <ThemeSelect />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive updates via email</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="text-sm font-medium">Savings Alerts</p>
                  <p className="text-xs text-muted-foreground">Get notified when you save money</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="text-sm font-medium">Plan Switch Updates</p>
                  <p className="text-xs text-muted-foreground">Updates on plan switching status</p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Push Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    {pushNotifications.isSupported
                      ? pushNotifications.isSubscribed
                        ? 'Enabled - Get real-time alerts'
                        : 'Enable browser notifications'
                      : 'Not supported on this device'}
                  </p>
                </div>
                {pushNotifications.isSupported && (
                  <Button
                    variant={pushNotifications.isSubscribed ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => {
                      if (pushNotifications.isSubscribed) {
                        pushNotifications.unsubscribe()
                        toast.success('Push notifications disabled')
                      } else {
                        pushNotifications.subscribe()
                        toast.success('Push notifications enabled!')
                      }
                    }}
                    disabled={pushNotifications.isLoading}
                  >
                    {pushNotifications.isLoading
                      ? 'Loading...'
                      : pushNotifications.isSubscribed
                      ? 'Disable'
                      : 'Enable'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-green-800">Savings Plan</p>
                    <p className="text-sm text-green-600">15% of verified savings</p>
                    <p className="text-xs text-green-600 mt-2">
                      You only pay when you save money!
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                    Active
                  </span>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                View Billing History
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
