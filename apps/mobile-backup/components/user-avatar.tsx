import React, { useState } from 'react'
import { View, StyleSheet, Image } from 'react-native'
import { Text } from './ui/text'
import { useTheme } from '../lib/theme-context'

interface UserAvatarProps {
  user?: {
    user_metadata?: {
      full_name?: string
      avatar_url?: string
      picture?: string
    }
    email?: string
  }
  size?: 'small' | 'medium' | 'large'
}

export function UserAvatar({ user, size = 'medium' }: UserAvatarProps) {
  const { colors } = useTheme()
  const [imageError, setImageError] = useState(false)

  const sizes = {
    small: {
      container: 32,
      text: 12,
    },
    medium: {
      container: 56,
      text: 20,
    },
    large: {
      container: 80,
      text: 28,
    }
  }

  const currentSize = sizes[size]

  // Get avatar URL from various possible sources
  const avatarUrl = user?.user_metadata?.avatar_url || 
                   user?.user_metadata?.picture ||
                   null

  // Get user initials
  const getInitials = () => {
    const fullName = user?.user_metadata?.full_name
    const email = user?.email
    
    if (fullName) {
      const names = fullName.split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase()
      }
      return fullName[0].toUpperCase()
    }
    
    if (email) {
      return email[0].toUpperCase()
    }
    
    return 'U'
  }

  const styles = StyleSheet.create({
    container: {
      width: currentSize.container,
      height: currentSize.container,
      borderRadius: currentSize.container / 2,
      backgroundColor: colors.muted,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: currentSize.container / 2,
    },
    initialsText: {
      fontSize: currentSize.text,
      fontWeight: '600',
      color: colors.foreground,
    },
  })

  const showImage = avatarUrl && !imageError

  return (
    <View style={styles.container}>
      {showImage ? (
        <Image 
          source={{ uri: avatarUrl }}
          style={styles.image}
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
      ) : (
        <Text style={styles.initialsText}>{getInitials()}</Text>
      )}
    </View>
  )
} 