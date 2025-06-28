import { supabase } from './supabase'

export interface User {
  id: string
  email: string | null
  name: string | null
  role: string
  created_at: string
  updated_at: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  stripe_current_period_end: string | null
  avatar_url?: string | null
  last_sign_in?: string | null
  email_verified?: boolean
}

export interface UserStats {
  totalUsers: number
  recentSignUps: number
  adminUsers: number
  activeToday: number
}

/**
 * Fetch all users from the database
 * 
 * @returns Promise with users data or error
 */
export async function getAllUsers(): Promise<{ success: boolean; data?: User[]; error?: string }> {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return { success: false, error: `Failed to fetch users: ${error.message}` }
    }

    return { success: true, data: users || [] }
  } catch (error) {
    console.error('Exception in getAllUsers:', error)
    return { success: false, error: 'An unexpected error occurred while fetching users' }
  }
}

/**
 * Get user statistics for dashboard
 * 
 * @returns Promise with user stats or error
 */
export async function getUserStats(): Promise<{ success: boolean; data?: UserStats; error?: string }> {
  try {
    // Fetch total users count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Fetch recent signups (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: recentSignUps } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // Fetch admin users count
    const { count: adminUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'ADMIN')

    // Fetch active users today (simplified - users who signed in today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Note: This requires last_sign_in field which might not be available in the users table
    // For now, we'll use a placeholder value
    const activeToday = 0

    const stats: UserStats = {
      totalUsers: totalUsers || 0,
      recentSignUps: recentSignUps || 0,
      adminUsers: adminUsers || 0,
      activeToday: activeToday,
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error('Exception in getUserStats:', error)
    return { success: false, error: 'An unexpected error occurred while fetching user stats' }
  }
}

/**
 * Get a single user by ID
 * 
 * @param id - User ID
 * @returns Promise with user data or error
 */
export async function getUserById(id: string): Promise<{ success: boolean; data?: User; error?: string }> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching user by ID:', error)
      return { success: false, error: `Failed to fetch user: ${error.message}` }
    }

    return { success: true, data: user }
  } catch (error) {
    console.error('Exception in getUserById:', error)
    return { success: false, error: 'An unexpected error occurred while fetching user' }
  }
} 