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
      campaign_daily_metrics: {
        Row: {
          campaign_id: string
          date: string
          sent: number
          delivered: number
          read: number
          clicked: number
          replied: number
          failed: number
          opt_outs: number
          bookings: number
          est_revenue: number
          gbp_impressions: number
          gbp_clicks: number
        }
        Insert: {
          campaign_id: string
          date: string
          sent?: number
          delivered?: number
          read?: number
          clicked?: number
          replied?: number
          failed?: number
          opt_outs?: number
          bookings?: number
          est_revenue?: number
          gbp_impressions?: number
          gbp_clicks?: number
        }
        Update: {
          campaign_id?: string
          date?: string
          sent?: number
          delivered?: number
          read?: number
          clicked?: number
          replied?: number
          failed?: number
          opt_outs?: number
          bookings?: number
          est_revenue?: number
          gbp_impressions?: number
          gbp_clicks?: number
        }
      }
      campaign_requests: {
        Row: {
          id: string
          org_id: string
          course_id: string
          requested_by: string
          template_name: string
          desired_send_time: string | null
          notes: string | null
          status: Database['public']['Enums']['request_status']
          decision_by: string | null
          decision_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          course_id: string
          requested_by: string
          template_name: string
          desired_send_time?: string | null
          notes?: string | null
          status?: Database['public']['Enums']['request_status']
          decision_by?: string | null
          decision_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          course_id?: string
          requested_by?: string
          template_name?: string
          desired_send_time?: string | null
          notes?: string | null
          status?: Database['public']['Enums']['request_status']
          decision_by?: string | null
          decision_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
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
      contact_imports: {
        Row: {
          id: string
          org_id: string
          course_id: string | null
          storage_path: string
          status: Database['public']['Enums']['import_status']
          rows_total: number | null
          rows_inserted: number | null
          rows_updated: number | null
          rows_ignored: number | null
          created_by: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          course_id?: string | null
          storage_path: string
          status?: Database['public']['Enums']['import_status']
          rows_total?: number | null
          rows_inserted?: number | null
          rows_updated?: number | null
          rows_ignored?: number | null
          created_by?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          course_id?: string | null
          storage_path?: string
          status?: Database['public']['Enums']['import_status']
          rows_total?: number | null
          rows_inserted?: number | null
          rows_updated?: number | null
          rows_ignored?: number | null
          created_by?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
      contact_list_members: {
        Row: {
          list_id: string
          contact_id: string
          added_at: string
        }
        Insert: {
          list_id: string
          contact_id: string
          added_at?: string
        }
        Update: {
          list_id?: string
          contact_id?: string
          added_at?: string
        }
      }
      contact_lists: {
        Row: {
          id: string
          org_id: string
          course_id: string | null
          name: string
          kind: Database['public']['Enums']['list_kind']
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          course_id?: string | null
          name: string
          kind?: Database['public']['Enums']['list_kind']
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          course_id?: string | null
          name?: string
          kind?: Database['public']['Enums']['list_kind']
          created_by?: string | null
          created_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          org_id: string
          course_id: string | null
          name: string | null
          phone: string
          email: string | null
          tags: string[]
          consent: Database['public']['Enums']['consent_status']
          consent_method: string | null
          consent_at: string | null
          opted_out_at: string | null
          source: string | null
          pinnacle_contact_id: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          course_id?: string | null
          name?: string | null
          phone: string
          email?: string | null
          tags?: string[]
          consent?: Database['public']['Enums']['consent_status']
          consent_method?: string | null
          consent_at?: string | null
          opted_out_at?: string | null
          source?: string | null
          pinnacle_contact_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          course_id?: string | null
          name?: string | null
          phone?: string
          email?: string | null
          tags?: string[]
          consent?: Database['public']['Enums']['consent_status']
          consent_method?: string | null
          consent_at?: string | null
          opted_out_at?: string | null
          source?: string | null
          pinnacle_contact_id?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      conversations: {
        Row: {
          id: string
          org_id: string
          course_id: string | null
          contact_id: string
          last_message_at: string
          last_direction: string
          unread_count: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          course_id?: string | null
          contact_id: string
          last_message_at?: string
          last_direction?: string
          unread_count?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          course_id?: string | null
          contact_id?: string
          last_message_at?: string
          last_direction?: string
          unread_count?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          org_id: string
          name: string
          timezone: string
          address_line1: string | null
          address_line2: string | null
          city: string | null
          region: string | null
          postal_code: string | null
          country: string | null
          latitude: number | null
          longitude: number | null
          google_place_id: string | null
          phone: string | null
          email: string | null
          pinnacle_profile_id: string | null
          send_window_start: string | null
          send_window_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          timezone: string
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          region?: string | null
          postal_code?: string | null
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          google_place_id?: string | null
          phone?: string | null
          email?: string | null
          pinnacle_profile_id?: string | null
          send_window_start?: string | null
          send_window_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          timezone?: string
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          region?: string | null
          postal_code?: string | null
          country?: string | null
          latitude?: number | null
          longitude?: number | null
          google_place_id?: string | null
          phone?: string | null
          email?: string | null
          pinnacle_profile_id?: string | null
          send_window_start?: string | null
          send_window_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      gbp_daily_metrics: {
        Row: {
          course_id: string
          date: string
          impressions: number
          website_visits: number
          calls: number
          direction_requests: number
        }
        Insert: {
          course_id: string
          date: string
          impressions?: number
          website_visits?: number
          calls?: number
          direction_requests?: number
        }
        Update: {
          course_id?: string
          date?: string
          impressions?: number
          website_visits?: number
          calls?: number
          direction_requests?: number
        }
      }
      message_sends: {
        Row: {
          id: string
          org_id: string
          course_id: string
          campaign_id: string
          contact_id: string
          pinnacle_message_id: string | null
          status: Database['public']['Enums']['message_status']
          send_attempted_at: string | null
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          first_click_at: string | null
          reply_at: string | null
          reply_text: string | null
          failure_reason: string | null
          fallback_used: boolean
          created_at: string
          updated_at: string
          provider_message_id: string | null
          conversation_id: string | null
        }
        Insert: {
          id?: string
          org_id: string
          course_id: string
          campaign_id: string
          contact_id: string
          pinnacle_message_id?: string | null
          status?: Database['public']['Enums']['message_status']
          send_attempted_at?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          first_click_at?: string | null
          reply_at?: string | null
          reply_text?: string | null
          failure_reason?: string | null
          fallback_used?: boolean
          created_at?: string
          updated_at?: string
          provider_message_id?: string | null
          conversation_id?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          course_id?: string
          campaign_id?: string
          contact_id?: string
          pinnacle_message_id?: string | null
          status?: Database['public']['Enums']['message_status']
          send_attempted_at?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          first_click_at?: string | null
          reply_at?: string | null
          reply_text?: string | null
          failure_reason?: string | null
          fallback_used?: boolean
          created_at?: string
          updated_at?: string
          provider_message_id?: string | null
          conversation_id?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          org_id: string
          course_id: string | null
          contact_id: string
          direction: string
          kind: string
          body: string | null
          media: Json | null
          action_payload: string | null
          provider_message_id: string | null
          provider_conversation_id: string | null
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          failed_at: string | null
          failure_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          org_id: string
          course_id?: string | null
          contact_id: string
          direction: string
          kind?: string
          body?: string | null
          media?: Json | null
          action_payload?: string | null
          provider_message_id?: string | null
          provider_conversation_id?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          org_id?: string
          course_id?: string | null
          contact_id?: string
          direction?: string
          kind?: string
          body?: string | null
          media?: Json | null
          action_payload?: string | null
          provider_message_id?: string | null
          provider_conversation_id?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      org_integrations: {
        Row: {
          id: string
          org_id: string
          provider: string
          agent_id: string | null
          brand_id: string | null
          phone_number: string | null
          api_key_alias: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          provider?: string
          agent_id?: string | null
          brand_id?: string | null
          phone_number?: string | null
          api_key_alias?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          provider?: string
          agent_id?: string | null
          brand_id?: string | null
          phone_number?: string | null
          api_key_alias?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      org_memberships: {
        Row: {
          id: string
          org_id: string
          user_id: string
          role: Database['public']['Enums']['membership_role']
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          role?: Database['public']['Enums']['membership_role']
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          role?: Database['public']['Enums']['membership_role']
          created_at?: string
        }
      }
      org_monthly_usage: {
        Row: {
          org_id: string
          month: string
          sends_used: number
        }
        Insert: {
          org_id: string
          month: string
          sends_used?: number
        }
        Update: {
          org_id?: string
          month?: string
          sends_used?: number
        }
      }
      org_subscriptions: {
        Row: {
          id: string
          org_id: string
          plan_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          billing_email: string | null
          status: string
          start_date: string | null
          end_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          plan_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          billing_email?: string | null
          status?: string
          start_date?: string | null
          end_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          plan_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          billing_email?: string | null
          status?: string
          start_date?: string | null
          end_date?: string | null
          created_at?: string
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
      plans: {
        Row: {
          id: string
          code: string
          name: string
          max_sends_per_month: number | null
          price_cents: number | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          max_sends_per_month?: number | null
          price_cents?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          max_sends_per_month?: number | null
          price_cents?: number | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          user_id: string
          org_id: string | null
          role: Database['public']['Enums']['user_role'] | null
          full_name: string | null
          timezone: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          org_id?: string | null
          role?: Database['public']['Enums']['user_role'] | null
          full_name?: string | null
          timezone?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          org_id?: string | null
          role?: Database['public']['Enums']['user_role'] | null
          full_name?: string | null
          timezone?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rcs_brand_verification_requests: {
        Row: {
          id: string
          org_id: string
          submitted_by: string | null
          legal_name: string | null
          dba: string | null
          website: string | null
          ein: string | null
          address: string | null
          contact_name: string | null
          contact_email: string | null
          contact_phone: string | null
          notes: string | null
          provider_brand_id: string | null
          status: string
          decision_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          submitted_by?: string | null
          legal_name?: string | null
          dba?: string | null
          website?: string | null
          ein?: string | null
          address?: string | null
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          notes?: string | null
          provider_brand_id?: string | null
          status?: string
          decision_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          submitted_by?: string | null
          legal_name?: string | null
          dba?: string | null
          website?: string | null
          ein?: string | null
          address?: string | null
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          notes?: string | null
          provider_brand_id?: string | null
          status?: string
          decision_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rcs_templates: {
        Row: {
          id: string
          org_id: string
          name: string
          code: Json
          fallback_sms_enabled: boolean
          fallback_text: string | null
          media_urls: string[]
          buttons: Json | null
          status: Database['public']['Enums']['template_status']
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          code: Json
          fallback_sms_enabled?: boolean
          fallback_text?: string | null
          media_urls?: string[]
          buttons?: Json | null
          status?: Database['public']['Enums']['template_status']
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          code?: Json
          fallback_sms_enabled?: boolean
          fallback_text?: string | null
          media_urls?: string[]
          buttons?: Json | null
          status?: Database['public']['Enums']['template_status']
          created_by?: string | null
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
      webhook_events: {
        Row: {
          id: number
          org_id: string
          course_id: string | null
          event_type: Database['public']['Enums']['webhook_event_type']
          external_event_id: string | null
          pinnacle_message_id: string | null
          contact_phone: string | null
          payload: Json
          received_at: string
          processed_at: string | null
        }
        Insert: {
          id?: number
          org_id: string
          course_id?: string | null
          event_type: Database['public']['Enums']['webhook_event_type']
          external_event_id?: string | null
          pinnacle_message_id?: string | null
          contact_phone?: string | null
          payload: Json
          received_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: number
          org_id?: string
          course_id?: string | null
          event_type?: Database['public']['Enums']['webhook_event_type']
          external_event_id?: string | null
          pinnacle_message_id?: string | null
          contact_phone?: string | null
          payload?: Json
          received_at?: string
          processed_at?: string | null
        }
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
