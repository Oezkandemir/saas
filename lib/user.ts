import { supabaseAdmin } from "@/lib/db";

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