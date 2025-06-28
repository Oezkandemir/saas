import React from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Stack } from 'expo-router'
import { useTheme } from '../lib/theme-context'
import { NotificationDebug } from '../components/notifications/notification-debug'

export default function NotificationDebugScreen() {
  const { colors } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Notification Debug',
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.foreground,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <ScrollView style={styles.scrollView}>
        <NotificationDebug />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
}) 