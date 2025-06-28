import { supabase } from './supabase'
import { Alert } from 'react-native'

export interface SignUpForm {
  email: string
  password: string
  name: string
}

export interface SignInForm {
  email: string
  password: string
}

export const signUp = async ({ email, password, name }: SignUpForm) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    if (error) {
      Alert.alert('Error', error.message)
      return { data: null, error }
    }

    Alert.alert('Success', 'Please check your email for verification link')
    return { data, error: null }
  } catch (error: any) {
    Alert.alert('Error', error.message)
    return { data: null, error }
  }
}

export const signIn = async ({ email, password }: SignInForm) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      Alert.alert('Error', error.message)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error: any) {
    Alert.alert('Error', error.message)
    return { data: null, error }
  }
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      Alert.alert('Error', error.message)
      return { error }
    }
    return { error: null }
  } catch (error: any) {
    Alert.alert('Error', error.message)
    return { error }
  }
} 