export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string
          org_id: string
          course_id: string
          template_id: string
          name: string
          description: string | null
          audience_kind: Database['public']['Enums']['audience_kind']
          audience_ref: string | null
          scheduled_at: string
          timezone: string
          status: Database['public']['Enums']['campaign_status']
          max_sends_per_minute: number | null
          client_visible: boolean
          created_by: string | null
          approved_by: string | null
          approved_at: string | null
          send_started_at: string | null
          send_completed_at: string | null
          stats_snapshot: Json | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          course_id: string
          template_id: string
          name: string
          description?: string | null
          audience_kind?: Database['public']['Enums']['audience_kind']
          audience_ref?: string | null
          scheduled_at: string
          timezone: string
          status?: Database['public']['Enums']['campaign_status']
          max_sends_per_minute?: number | null
          client_visible?: boolean
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          send_started_at?: string | null
          send_completed_at?: string | null
          stats_snapshot?: Json | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          course_id?: string
          template_id?: string
          name?: string
          description?: string | null
          audience_kind?: Database['public']['Enums']['audience_kind']
          audience_ref?: string | null
          scheduled_at?: string
          timezone?: string
          status?: Database['public']['Enums']['campaign_status']
          max_sends_per_minute?: number | null
          client_visible?: boolean
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          send_started_at?: string | null
          send_completed_at?: string | null
          stats_snapshot?: Json | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      calendar_events: {
        Row: {
          id: string
          org_id: string
          course_id: string | null
          event_type: Database['public']['Enums']['calendar_event_type']
          campaign_id: string | null
          title: string
          description: string | null
          start_time: string
          end_time: string | null
          status: string
          created_by: string | null
          is_client_visible: boolean
          created_at: string
          updated_at: string
          event_status: Database['public']['Enums']['calendar_event_status']
        }
        Insert: {
          id?: string
          org_id: string
          course_id?: string | null
          event_type: Database['public']['Enums']['calendar_event_type']
          campaign_id?: string | null
          title: string
          description?: string | null
          start_time: string
          end_time?: string | null
          status?: string
          created_by?: string | null
          is_client_visible?: boolean
          created_at?: string
          updated_at?: string
          event_status?: Database['public']['Enums']['calendar_event_status']
        }
        Update: {
          id?: string
          org_id?: string
          course_id?: string | null
          event_type?: Database['public']['Enums']['calendar_event_type']
          campaign_id?: string | null
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string | null
          status?: string
          created_by?: string | null
          is_client_visible?: boolean
          created_at?: string
          updated_at?: string
          event_status?: Database['public']['Enums']['calendar_event_status']
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          status: string
          default_send_window_start: string | null
          default_send_window_end: string | null
          pinnacle_company_id: string | null
          pinnacle_brand_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          status?: string
          default_send_window_start?: string | null
          default_send_window_end?: string | null
          pinnacle_company_id?: string | null
          pinnacle_brand_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          status?: string
          default_send_window_start?: string | null
          default_send_window_end?: string | null
          pinnacle_company_id?: string | null
          pinnacle_brand_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      send_jobs: {
        Row: {
          id: string
          campaign_id: string
          run_at: string
          status: Database['public']['Enums']['job_status']
          attempts: number
          last_error: string | null
          created_at: string
          updated_at: string
          locked_at: string | null
          locked_by: string | null
        }
        Insert: {
          id?: string
          campaign_id: string
          run_at: string
          status?: Database['public']['Enums']['job_status']
          attempts?: number
          last_error?: string | null
          created_at?: string
          updated_at?: string
          locked_at?: string | null
          locked_by?: string | null
        }
        Update: {
          id?: string
          campaign_id?: string
          run_at?: string
          status?: Database['public']['Enums']['job_status']
          attempts?: number
          last_error?: string | null
          created_at?: string
          updated_at?: string
          locked_at?: string | null
          locked_by?: string | null
        }
      }
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
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      audience_kind: 'all_contacts' | 'list' | 'csv' | 'contact_list' | 'smart_list'
      calendar_event_status: 'scheduled' | 'cancelled' | 'completed'
      calendar_event_type: 'campaign' | 'task' | 'blackout' | 'campaign_send' | 'course_event' | 'maintenance' | 'other'
      campaign_status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'canceled' | 'paused' | 'completed' | 'cancelled'
      consent_status: 'unknown' | 'opted_in' | 'opted_out'
      import_status: 'pending' | 'processing' | 'completed' | 'failed'
      job_status: 'pending' | 'running' | 'succeeded' | 'failed' | 'retrying' | 'completed'
      list_kind: 'static' | 'smart'
      membership_role: 'owner' | 'client_admin' | 'client_viewer' | 'agency_staff'
      message_status: 'queued' | 'sent' | 'delivered' | 'read' | 'clicked' | 'replied' | 'failed' | 'opt_out' | 'fallback_sent'
      org_status: 'active' | 'suspended' | 'archived'
      request_status: 'submitted' | 'approved' | 'rejected' | 'scheduled' | 'canceled' | 'completed' | 'cancelled'
      template_status: 'draft' | 'approved' | 'archived' | 'submitted' | 'rejected'
      user_role: 'owner' | 'client_admin' | 'client_viewer' | 'agency_staff'
      webhook_event_type: 'message_submitted' | 'message_sent' | 'delivery' | 'read' | 'click' | 'reply' | 'opt_out' | 'failure' | 'unknown' | 'inbound_text' | 'inbound_media' | 'inbound_action' | 'delivered' | 'clicked' | 'failed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
