import { supabaseAdmin } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { env } from "@/env.mjs";
import { User } from "@supabase/supabase-js";

/**
 * Ensures that a user record exists in the database users table
 * when a user authenticates with Supabase Auth
 */
export async function syncUserWithDatabase(user: User) {
  if (!user || !user.id || !user.email) {
    console.error("Invalid user object provided to syncUserWithDatabase");
    return null;
  }

  try {
    console.log(`Checking if user ${user.id} exists in database...`);
    
    // First try to get the user by ID directly
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    // If we found the user, return success
    if (existingUser) {
      console.log(`User ${user.id} already exists in database`);
      return existingUser;
    }
    
    // If error is not "no rows returned", log it
    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error checking for existing user:", fetchError);
    }
    
    // If user not found by ID, try to find by email
    if (user.email) {
      const { data: userByEmail } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", user.email)
        .single();
        
      if (userByEmail) {
        console.log(`Found user with same email but different ID. Email: ${user.email}, DB ID: ${userByEmail.id}, Auth ID: ${user.id}`);
        
        // Try to update the user ID to match the auth ID
        try {
          const { error: updateError } = await supabaseAdmin
            .from("users")
            .update({ id: user.id })
            .eq("id", userByEmail.id);
            
          if (updateError) {
            console.error("Could not update user ID:", updateError);
          } else {
            console.log(`Updated user ID from ${userByEmail.id} to ${user.id}`);
            return { id: user.id, isNew: false };
          }
        } catch (err) {
          console.error("Error updating user ID:", err);
        }
      }
    }

    // Create a Stripe customer for the new user if Stripe is configured
    let stripeCustomerId: string | null = null;
    if (env.STRIPE_API_KEY && env.STRIPE_API_KEY.length > 0) {
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.user_metadata?.name || user.email.split('@')[0],
          metadata: {
            userId: user.id
          }
        });
        stripeCustomerId = customer.id;
        console.log(`Created Stripe customer ${stripeCustomerId} for user ${user.id}`);
      } catch (stripeError) {
        console.error(`Error creating Stripe customer for user ${user.id}:`, stripeError);
        // Continue without Stripe customer ID
      }
    }

    // Try direct insert without email if it's causing conflicts
    console.log(`Creating new user record for ${user.id}`);
    
    // Stelle sicher, dass wir die avatar_url aus den Metadaten übernehmen
    const avatar_url = user.user_metadata?.avatar_url || null;
    
    // First try with all data
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || null,
        role: user.user_metadata?.role || "USER",
        avatar_url: avatar_url,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: null,
        stripe_price_id: null,
        stripe_current_period_end: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating user record:", insertError);
      
      // If the error is due to email uniqueness, try without email
      if (insertError.code === '23505' && insertError.details?.includes('email')) {
        console.log("Trying insert without email due to uniqueness constraint");
        
        const { error: insertNoEmailError } = await supabaseAdmin
          .from("users")
          .insert({
            id: user.id,
            // No email field
            name: user.user_metadata?.name || user.email?.split('@')[0] || null,
            role: user.user_metadata?.role || "USER",
            avatar_url: avatar_url,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: null,
            stripe_price_id: null,
            stripe_current_period_end: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
        if (insertNoEmailError) {
          console.error("Error creating user without email:", insertNoEmailError);
          return null;
        }
        
        console.log(`Successfully created user record for ${user.id} without email`);
        return { id: user.id, isNew: true };
      }
      
      return null;
    }
    
    console.log(`Successfully created user record for ${user.id}`);
    return newUser;
  } catch (error) {
    console.error("Unexpected error in syncUserWithDatabase:", error);
    return null;
  }
} 