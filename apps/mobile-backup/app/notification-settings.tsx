import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import { useTheme } from '../lib/theme-context'
import { NotificationSettings } from '../components/notifications/notification-settings'

export default function NotificationSettingsScreen() {
  const { colors } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Notification Settings',
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.foreground,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <NotificationSettings />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}) 