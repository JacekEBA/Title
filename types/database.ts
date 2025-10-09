profiles: {
  Row: {
    user_id: string
    org_id: string | null
    role: Database['public']['Enums']['membership_role']
    full_name: string | null
    timezone: string | null
    phone: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    user_id: string
    org_id?: string | null
    role: Database['public']['Enums']['membership_role']
    full_name?: string | null
    timezone?: string | null
    phone?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    user_id?: string
    org_id?: string | null
    role?: Database['public']['Enums']['membership_role']
    full_name?: string | null
    timezone?: string | null
    phone?: string | null
    created_at?: string
    updated_at?: string
  }
}
