import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Switch, Pressable, Alert } from 'react-native'
import { router } from 'expo-router'
import { Text } from '../ui/text'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { useTheme } from '../../lib/theme-context'
import { pushNotificationService } from '../../lib/push-notification-service'
import * as Notifications from 'expo-notifications'
import { ChevronRight, Bell, BellOff, Settings, Bug } from 'lucide-react-native'

export function NotificationSettings() {
  const { colors } = useTheme()
  const [pushEnabled, setPushEnabled] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  const [permissions, setPermissions] = useState<Notifications.NotificationPermissionsStatus | null>(null)
  const [pushToken, setPushToken] = useState<string | null>(null)

  useEffect(() => {
    checkPermissions()
    loadSettings()
  }, [])

  /**
   * Check current notification permissions
   */
  const checkPermissions = async () => {
    try {
      const permissionStatus = await pushNotificationService.getPermissionStatus()
      setPermissions(permissionStatus)
      setPushEnabled(permissionStatus.status === 'granted')
      
      const token = pushNotificationService.getPushToken()
      setPushToken(token)
    } catch (error) {
      console.error('Error checking permissions:', error)
    }
  }

  /**
   * Load user settings (this would typically come from your backend/storage)
   */
  const loadSettings = async () => {
    // You can load these from AsyncStorage or your backend
    // For now, using default values
    setSoundEnabled(true)
    setVibrationEnabled(true)
  }

  /**
   * Request notification permissions
   */
  const requestPermissions = async () => {
    try {
      const token = await pushNotificationService.registerForPushNotifications()
      if (token) {
        setPushToken(token)
        setPushEnabled(true)
        Alert.alert('Success', 'Push notifications enabled successfully!')
      } else {
        Alert.alert('Permission Denied', 'Push notifications require permission to work.')
      }
      await checkPermissions()
    } catch (error) {
      console.error('Error requesting permissions:', error)
      Alert.alert('Error', 'Failed to request notification permissions')
    }
  }

  /**
   * Test notification functionality
   */
  const sendTestNotification = async () => {
    try {
      await pushNotificationService.sendLocalNotification(
        'Test Notification',
        'This is a test notification to check if everything is working correctly.',
        { test: true }
      )
      Alert.alert('Test Sent', 'Check your notification center for the test notification.')
    } catch (error) {
      console.error('Error sending test notification:', error)
      Alert.alert('Error', 'Failed to send test notification')
    }
  }

  /**
   * Clear all notifications
   */
  const clearAllNotifications = async () => {
    try {
      await pushNotificationService.clearAllNotifications()
      Alert.alert('Cleared', 'All notifications have been cleared from the notification center.')
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }

  /**
   * Save notification preferences (this would typically save to your backend)
   */
  const savePreferences = async () => {
    try {
      // You would save these preferences to AsyncStorage or your backend
      Alert.alert('Saved', 'Notification preferences have been saved.')
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }

  const getPermissionStatusText = () => {
    if (!permissions) return 'Checking...'
    
    switch (permissions.status) {
      case 'granted':
        return 'Enabled'
      case 'denied':
        return 'Denied'
      case 'undetermined':
        return 'Not requested'
      default:
        return 'Unknown'
    }
  }

  const getPermissionStatusColor = () => {
    if (!permissions) return colors.mutedForeground
    
    switch (permissions.status) {
      case 'granted':
        return '#10B981' // green
      case 'denied':
        return '#EF4444' // red
      case 'undetermined':
        return '#F59E0B' // yellow
      default:
        return colors.mutedForeground
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Notification Settings
      </Text>

      {/* Push Notifications Status */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Bell size={20} color={colors.foreground} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Push Notifications
            </Text>
          </View>
          <Text style={[styles.statusText, { color: getPermissionStatusColor() }]}>
            {getPermissionStatusText()}
          </Text>
        </View>
        
        {!pushEnabled && (
          <Button
            onPress={requestPermissions}
            style={styles.enableButton}
          >
            <Text>Enable Push Notifications</Text>
          </Button>
        )}

        {pushToken && (
          <View style={styles.tokenContainer}>
            <Text style={[styles.tokenLabel, { color: colors.mutedForeground }]}>
              Device Token:
            </Text>
            <Text style={[styles.tokenText, { color: colors.foreground }]} numberOfLines={1}>
              {pushToken.substring(0, 32)}...
            </Text>
          </View>
        )}
      </Card>

      {/* Notification Preferences */}
      {pushEnabled && (
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <Settings size={20} color={colors.foreground} />
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Notification Preferences
              </Text>
            </View>
          </View>

          <View style={styles.preferenceRow}>
            <Text style={[styles.preferenceLabel, { color: colors.foreground }]}>
              Sound
            </Text>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={soundEnabled ? colors.background : colors.mutedForeground}
            />
          </View>

          <View style={styles.preferenceRow}>
            <Text style={[styles.preferenceLabel, { color: colors.foreground }]}>
              Vibration
            </Text>
            <Switch
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={vibrationEnabled ? colors.background : colors.mutedForeground}
            />
          </View>

          <Button
            onPress={savePreferences}
            style={styles.saveButton}
            variant="outline"
          >
            <Text>Save Preferences</Text>
          </Button>
        </Card>
      )}

      {/* Test and Debug Section */}
      {pushEnabled && (
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Test & Debug
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <Button
              onPress={sendTestNotification}
              style={styles.testButton}
              variant="outline"
            >
              <Text>Send Test Notification</Text>
            </Button>

            <Button
              onPress={clearAllNotifications}
              style={styles.testButton}
              variant="outline"
            >
              <Text>Clear All</Text>
            </Button>
          </View>
        </Card>
      )}

            {/* Debug Section */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Bug size={20} color={colors.foreground} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Troubleshooting
            </Text>
          </View>
        </View>
        
        <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
          Having issues with notifications? Use the debug tool to troubleshoot.
        </Text>

        <Button
          onPress={() => router.push('/notification-debug')}
          style={styles.debugButton}
          variant="outline"
        >
          <Text>🔧 Open Debug Tool</Text>
        </Button>
      </Card>

      {/* Help Section */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            About Push Notifications
          </Text>
        </View>
        
        <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
          Push notifications help you stay updated with important information even when the app is closed. 
          You can manage these settings at any time.
        </Text>

        {permissions?.status === 'denied' && (
          <Text style={[styles.helpText, { color: '#EF4444', marginTop: 8 }]}>
            Notifications are currently disabled in your device settings. 
            Please enable them in Settings &gt; Notifications &gt; Your App to receive push notifications.
          </Text>
        )}
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  enableButton: {
    marginTop: 8,
  },
  tokenContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  tokenLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    marginTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  testButton: {
    flex: 1,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
  },
  debugButton: {
    marginTop: 16,
  },
}) 