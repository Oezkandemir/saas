import React, { useState } from 'react'
import { View, ScrollView, StyleSheet, Image, Pressable } from 'react-native'
import { router } from 'expo-router'
import { Text } from '../components/ui/text'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { FormItem, FormLabel, FormControl } from '../components/ui/form'
import { Separator } from '../components/ui/separator'
import { Header } from '../components/layout/header'
import { Camera, Mail, User, Calendar } from 'lucide-react-native'
import { useTheme } from '../lib/theme-context'
import { useAuth } from '../lib/auth-context'
import { formatDistanceToNow } from 'date-fns'

export default function ProfileScreen() {
  const { colors } = useTheme()
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.user_metadata?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  
  // User info
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const userEmail = user?.email || ''
  const userRole = user?.user_metadata?.role || 'USER'
  const avatarUrl = user?.user_metadata?.avatar_url || null
  const memberSince = user?.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) : 'Recently'

  const handleSave = () => {
    // TODO: Implement profile update
    console.log('Save profile:', { name, email })
    setEditing(false)
  }

  const handleCancel = () => {
    setName(user?.user_metadata?.name || '')
    setEmail(user?.email || '')
    setEditing(false)
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 24,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    avatarContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.muted,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      overflow: 'hidden',
      position: 'relative',
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    avatarFallback: {
      fontSize: 36,
      fontWeight: '600',
      color: colors.foreground,
    },
    cameraButton: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.background,
    },
    userInfo: {
      alignItems: 'center',
    },
    userName: {
      fontSize: 24,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 16,
      color: colors.mutedForeground,
      marginBottom: 8,
    },
    userRole: {
      fontSize: 14,
      color: colors.mutedForeground,
      backgroundColor: colors.muted,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 16,
    },
    infoCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 12,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.mutedForeground,
      flex: 1,
    },
    infoValue: {
      fontSize: 14,
      color: colors.foreground,
      fontWeight: '500',
    },
    editActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    editButton: {
      flex: 1,
    },
  })

  return (
    <View style={styles.container}>
      <Header title="Profile" showBackButton={true} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image 
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarFallback}>
                  {displayName[0]?.toUpperCase() || 'U'}
                </Text>
              )}
              
              <Pressable style={styles.cameraButton}>
                <Camera size={16} color={colors.primaryForeground} />
              </Pressable>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{userEmail}</Text>
              <Text style={styles.userRole}>{userRole}</Text>
            </View>
          </View>

          {/* Account Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            
            {editing ? (
              <View style={styles.infoCard}>
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter your name"
                    />
                  </FormControl>
                </FormItem>

                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      editable={false} // Email usually not editable
                      style={{ opacity: 0.6 }}
                    />
                  </FormControl>
                </FormItem>
              </View>
            ) : (
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <User size={16} color={colors.mutedForeground} />
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>{displayName}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Mail size={16} color={colors.mutedForeground} />
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{userEmail}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Calendar size={16} color={colors.mutedForeground} />
                  <Text style={styles.infoLabel}>Member since:</Text>
                  <Text style={styles.infoValue}>{memberSince}</Text>
                </View>
              </View>
            )}

            {/* Edit Actions */}
            {editing ? (
              <View style={styles.editActions}>
                <Button 
                  variant="outline" 
                  style={styles.editButton}
                  onPress={handleCancel}
                >
                  <Text>Cancel</Text>
                </Button>
                <Button 
                  style={styles.editButton}
                  onPress={handleSave}
                >
                  <Text>Save Changes</Text>
                </Button>
              </View>
            ) : (
              <View style={styles.editActions}>
                <Button 
                  style={styles.editButton}
                  onPress={() => setEditing(true)}
                >
                  <Text>Edit Profile</Text>
                </Button>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
} 