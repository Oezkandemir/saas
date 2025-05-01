import { supabaseAdmin } from "@/lib/db";
import { sendSignupConfirmationEmail } from "./email";
import { getSupabaseClient } from "./supabase";
import { syncUserWithDatabase } from "./auth-sync";

export const getUserByEmail = async (email: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('name, emailVerified')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error("Error fetching user by email:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Exception fetching user by email:", error);
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Error fetching user by id:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Exception fetching user by id:", error);
    return null;
  }
};

// New function to handle custom signup with email confirmation
export const signUpWithEmailConfirmation = async (
  email: string,
  password: string,
  name?: string
) => {
  try {
    const supabase = getSupabaseClient();
    
    // Sign up the user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: {
          name: name || email.split('@')[0],
        },
      },
    });
    
    if (error) throw error;
    
    // If we have a user, sync them to the database
    if (data.user) {
      await syncUserWithDatabase(data.user);
      
      // Generate a confirmation OTP
      const { error: otpError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      
      if (otpError) {
        console.error("Error requesting email confirmation:", otpError);
        return { success: false, error: otpError.message };
      }
      
      // Send custom confirmation email
      // Note: Since we can't easily get the actual token URL from the resend method,
      // we'll need to create a new token or handle this differently in a production app
      const confirmUrl = `${window.location.origin}/auth/confirm?email=${encodeURIComponent(email)}`;
      
      await sendSignupConfirmationEmail({
        email,
        name: name || email.split('@')[0],
        actionUrl: confirmUrl,
      });
      
      return { success: true, user: data.user };
    }
    
    return { success: false, error: "No user returned from sign up" };
  } catch (error) {
    console.error("Error signing up user:", error);
    return { 
      success: false, 
      error: error.message || "An error occurred during sign up" 
    };
  }
};