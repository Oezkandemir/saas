import React, { createContext, useContext, useEffect, useState } from 'react'
import { useColorScheme, StatusBar } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { lightTheme, darkTheme, getThemeColors } from '../theme'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
  colors: Record<string, string>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const systemTheme = useColorScheme()

  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
  const colors = getThemeColors(isDark ? darkTheme : lightTheme)

  useEffect(() => {
    // Load theme from storage
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(storageKey)
        if (storedTheme) {
          setTheme(storedTheme as Theme)
        }
      } catch (error) {
        console.log('Error loading theme:', error)
      }
    }
    loadTheme()
  }, [storageKey])

  const handleSetTheme = async (newTheme: Theme) => {
    try {
      setTheme(newTheme)
      await AsyncStorage.setItem(storageKey, newTheme)
    } catch (error) {
      console.log('Error saving theme:', error)
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: handleSetTheme,
        isDark,
        colors,
      }}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 