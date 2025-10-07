export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];
export interface Database {
  public: { Tables: Record<string, any>; Views: Record<string, any>; Functions: Record<string, any>; Enums: Record<string, any>; };
}
// Replace this stub with generated types later using supabase gen types; keep the same file path and name.
