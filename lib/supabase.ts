import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const normalizedSupabaseUrl = supabaseUrl?.replace(/\/rest\/v1\/?$/, "");

export function getSupabaseConfigError() {
  if (!supabaseUrl) {
    return "NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.";
  }

  if (!supabaseAnonKey) {
    return "NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.";
  }

  return null;
}

export const supabase = createClient(
  normalizedSupabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-anon-key"
);
