import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Alert, Platform } from 'react-native'
import { Text } from '../ui/text'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { useTheme } from '../../lib/theme-context'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

export function NotificationDebug() {
  const { colors } = useTheme()
  const [deviceInfo, setDeviceInfo] = useState<any>({})
  const [permissionInfo, setPermissionInfo] = useState<any>({})
  const [pushToken, setPushToken] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `${timestamp}: ${message}`])
    console.log(`[NotificationDebug] ${message}`)
  }

  useEffect(() => {
    loadDebugInfo()
  }, [])

  const loadDebugInfo = async () => {
    try {
      // Device info
      const deviceData = {
        isDevice: Device.isDevice,
        deviceType: Device.deviceType,
        platform: Platform.OS,
        osVersion: Platform.Version,
        brand: Device.brand,
        modelName: Device.modelName,
      }
      setDeviceInfo(deviceData)
      addLog(`Device: ${JSON.stringify(deviceData)}`)

      // Permission info
      const permissions = await Notifications.getPermissionsAsync()
      setPermissionInfo(permissions)
      addLog(`Permissions: ${JSON.stringify(permissions)}`)

    } catch (error) {
      addLog(`Error loading debug info: ${error}`)
    }
  }

  const requestPermissionsDebug = async () => {
    try {
      addLog('Starting permission request...')
      
      if (!Device.isDevice) {
        addLog('❌ ISSUE: Running on simulator/emulator - permissions will not work!')
        Alert.alert(
          'Simulator Detected', 
          'Push notifications require a physical device. Please test on a real iPhone or Android device.'
        )
        return
      }

      addLog('✅ Running on physical device')

      // Check current permissions first
      const currentPermissions = await Notifications.getPermissionsAsync()
      addLog(`Current permission status: ${currentPermissions.status}`)

      if (currentPermissions.status === 'denied') {
        addLog('❌ Permission previously denied - need to go to system settings')
        Alert.alert(
          'Permission Denied',
          'You previously denied notification permissions. Please go to your device Settings > Notifications > Your App to enable them.',
          [
            { text: 'OK', style: 'default' }
          ]
        )
        return
      }

      // Request permissions
      addLog('Requesting permissions...')
      const { status } = await Notifications.requestPermissionsAsync()
      addLog(`Permission result: ${status}`)

      if (status === 'granted') {
        addLog('✅ Permission granted! Getting push token...')
        
        // Get push token
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync()
          setPushToken(tokenData.data)
          addLog(`✅ Push token obtained: ${tokenData.data.substring(0, 20)}...`)
          
          Alert.alert('Success!', 'Push notifications are now enabled!')
        } catch (tokenError) {
          addLog(`❌ Token error: ${tokenError}`)
          Alert.alert('Token Error', `Failed to get push token: ${tokenError}`)
        }
      } else {
        addLog(`❌ Permission not granted: ${status}`)
        Alert.alert('Permission Not Granted', `Status: ${status}`)
      }

      // Refresh permission info
      const newPermissions = await Notifications.getPermissionsAsync()
      setPermissionInfo(newPermissions)
      
    } catch (error) {
      addLog(`❌ Error in permission request: ${error}`)
      Alert.alert('Error', `Permission request failed: ${error}`)
    }
  }

  const sendTestNotification = async () => {
    try {
      addLog('Sending test notification...')
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Notification 📱",
          body: "This is a test notification from your app!",
          data: { test: true },
        },
        trigger: null, // Immediate
      })
      
      addLog('✅ Test notification sent')
      Alert.alert('Test Sent', 'Check your notification center!')
    } catch (error) {
      addLog(`❌ Test notification error: ${error}`)
      Alert.alert('Error', `Failed to send test: ${error}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        🔧 Notification Debug Tool
      </Text>

      {/* Device Info */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>
          Device Information
        </Text>
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Is Physical Device: {deviceInfo.isDevice ? '✅ Yes' : '❌ No (Simulator)'}
        </Text>
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Platform: {deviceInfo.platform} {deviceInfo.osVersion}
        </Text>
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Device: {deviceInfo.brand} {deviceInfo.modelName}
        </Text>
      </Card>

      {/* Permission Info */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>
          Permission Status
        </Text>
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Status: {permissionInfo.status || 'Unknown'}
        </Text>
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Can Ask Again: {permissionInfo.canAskAgain ? 'Yes' : 'No'}
        </Text>
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Granted: {permissionInfo.granted ? 'Yes' : 'No'}
        </Text>
      </Card>

      {/* Push Token */}
      {pushToken && (
        <Card style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Push Token
          </Text>
          <Text style={[styles.tokenText, { color: colors.mutedForeground }]}>
            {pushToken.substring(0, 50)}...
          </Text>
        </Card>
      )}

      {/* Actions */}
      <View style={styles.buttonRow}>
        <Button
          onPress={requestPermissionsDebug}
          style={styles.button}
        >
          <Text>🔓 Request Permissions</Text>
        </Button>

        <Button
          onPress={sendTestNotification}
          style={styles.button}
          variant="outline"
        >
          <Text>📤 Send Test</Text>
        </Button>
      </View>

      <Button
        onPress={loadDebugInfo}
        style={styles.refreshButton}
        variant="outline"
      >
        <Text>🔄 Refresh Info</Text>
      </Button>

      {/* Debug Logs */}
      <Card style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.logHeader}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Debug Logs
          </Text>
          <Button
            onPress={clearLogs}
            variant="outline"
            style={styles.clearButton}
          >
            <Text style={{ fontSize: 12 }}>Clear</Text>
          </Button>
        </View>
        
        <View style={styles.logContainer}>
          {logs.length === 0 ? (
            <Text style={[styles.logText, { color: colors.mutedForeground }]}>
              No logs yet. Try requesting permissions or sending a test notification.
            </Text>
          ) : (
            logs.slice(-10).map((log, index) => (
              <Text key={index} style={[styles.logText, { color: colors.mutedForeground }]}>
                {log}
              </Text>
            ))
          )}
        </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
  },
  refreshButton: {
    marginBottom: 16,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logContainer: {
    maxHeight: 200,
  },
  logText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 2,
    fontFamily: 'monospace',
  },
}) 