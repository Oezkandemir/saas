import React from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { Text } from '../../components/ui/text'
import { Header } from '../../components/layout/header'
import { useTheme } from '../../lib/theme-context'
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react-native'

export default function AnalyticsScreen() {
  const { colors } = useTheme()

  const metrics = [
    { title: 'Page Views', value: '24,890', change: '+15%', icon: BarChart3 },
    { title: 'User Growth', value: '1,247', change: '+8%', icon: TrendingUp },
    { title: 'Active Users', value: '892', change: '+12%', icon: Users },
    { title: 'Revenue', value: '$12,340', change: '+23%', icon: DollarSign },
  ]

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 24,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 16,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    metricCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      width: '47%',
      minWidth: 140,
    },
    metricHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    metricTitle: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.mutedForeground,
    },
    metricIconContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.muted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    metricValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 4,
    },
    metricChange: {
      fontSize: 11,
      fontWeight: '500',
      color: '#22c55e',
    },
    comingSoon: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 32,
      alignItems: 'center',
    },
    comingSoonText: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: 'center',
    },
  })

  return (
    <View style={styles.container}>
      <Header title="Analytics" showBackButton={true} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Metrics Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            <View style={styles.metricsGrid}>
              {metrics.map((metric, index) => {
                const IconComponent = metric.icon
                return (
                  <View key={index} style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricTitle}>{metric.title}</Text>
                      <View style={styles.metricIconContainer}>
                        <IconComponent size={14} color={colors.mutedForeground} />
                      </View>
                    </View>
                    <Text style={styles.metricValue}>{metric.value}</Text>
                    <Text style={styles.metricChange}>{metric.change}</Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* Charts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Charts & Reports</Text>
            <View style={styles.comingSoon}>
              <BarChart3 size={48} color={colors.mutedForeground} />
              <Text style={styles.comingSoonText}>
                Detailed analytics charts and reports will be available soon.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
} 