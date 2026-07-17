import { supabase } from "@/lib/supabase";

export async function checkSupabaseConnection() {
  return supabase.auth.getSession();
}