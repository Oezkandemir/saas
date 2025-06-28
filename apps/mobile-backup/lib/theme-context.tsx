import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Appearance, ColorSchemeName } from 'react-native'

type Theme = 'light' | 'dark' | 'system'

interface Colors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  border: string
  input: string
  ring: string
}

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  colors: Colors
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const lightColors: Colors = {
  background: '#ffffff',
  foreground: '#000000',
  card: '#ffffff',
  cardForeground: '#000000',
  popover: '#ffffff',
  popoverForeground: '#000000',
  primary: '#000000',
  primaryForeground: '#ffffff',
  secondary: '#f5f5f5',
  secondaryForeground: '#000000',
  muted: '#f5f5f5',
  mutedForeground: '#666666',
  accent: '#f5f5f5',
  accentForeground: '#000000',
  destructive: '#dc2626',
  destructiveForeground: '#ffffff',
  border: '#e5e5e5',
  input: '#e5e5e5',
  ring: '#000000',
}

const darkColors: Colors = {
  background: '#000000',      // Tiefschwarzer Hintergrund
  foreground: '#ffffff',      // Reines Weiß für Text
  card: '#000000',           // Schwarze Karten mit Border
  cardForeground: '#ffffff',  // Weißer Text auf Karten
  popover: '#111111',        // Sehr dunkles Grau für Popover
  popoverForeground: '#ffffff',
  primary: '#ffffff',        // Weiß als Primary
  primaryForeground: '#000000',
  secondary: '#111111',      // Sehr dunkles Grau für Secondary
  secondaryForeground: '#ffffff',
  muted: '#111111',          // Sehr dunkel für Muted Elements
  mutedForeground: '#cccccc', // Hellgrau für Muted Text
  accent: '#1a1a1a',         // Dunkelgrau für Accent
  accentForeground: '#ffffff',
  destructive: '#ff4444',    // Helleres Rot für bessere Sichtbarkeit
  destructiveForeground: '#ffffff',
  border: '#333333',         // Dunkle Borders für Abgrenzung
  input: '#111111',          // Dunkle Input-Felder
  ring: '#ffffff',           // Weiße Focus-Ringe
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme() || 'light'
  )

  useEffect(() => {
    // Load saved theme
    loadTheme()

    // Listen to system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme)
    })

    return () => subscription?.remove()
  }, [])

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme')
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeState(savedTheme as Theme)
      }
    } catch (error) {
      console.log('Error loading theme:', error)
    }
  }

  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem('theme', newTheme)
      setThemeState(newTheme)
    } catch (error) {
      console.log('Error saving theme:', error)
    }
  }

  const resolvedTheme = theme === 'system' ? systemColorScheme || 'light' : theme
  const isDark = resolvedTheme === 'dark'
  const colors = isDark ? darkColors : lightColors

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        colors,
        isDark,
      }}
    >
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