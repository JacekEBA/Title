// Database types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enums
export type ConsentStatus = 'unknown' | 'explicit' | 'implicit';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
export type TemplateStatus = 'draft' | 'active' | 'archived';
export type MembershipRole = 'owner' | 'agency_staff' | 'client_admin' | 'client_viewer';
export type AudienceKind = 'all_contacts' | 'contact_list';
export type EventType = 'campaign_send' | 'meeting' | 'deadline';
export type EventStatus = 'scheduled' | 'completed' | 'cancelled';

// Table types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: string;
  default_send_window_start: string | null;
  default_send_window_end: string | null;
  pinnacle_company_id: string | null;
  pinnacle_brand_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  user_id: string;
  org_id: string | null;
  role: MembershipRole;
  full_name: string | null;
  timezone: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  org_id: string;
  name: string;
  timezone: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string | null;
  phone: string | null;
  email: string | null;
  pinnacle_profile_id: string | null;
  send_window_start: string | null;
  send_window_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  org_id: string;
  course_id: string | null;
  name: string | null;
  phone: string;
  email: string | null;
  tags: string[];
  consent: ConsentStatus;
  consent_method: string | null;
  consent_at: string | null;
  opted_out_at: string | null;
  source: string | null;
  pinnacle_contact_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Campaign {
  id: string;
  org_id: string;
  course_id: string;
  template_id: string;
  name: string;
  description: string | null;
  audience_kind: AudienceKind;
  audience_ref: string | null;
  scheduled_at: string;
  timezone: string;
  status: CampaignStatus;
  max_sends_per_minute: number | null;
  client_visible: boolean;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  send_started_at: string | null;
  send_completed_at: string | null;
  stats_snapshot: Json | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RcsTemplate {
  id: string;
  org_id: string;
  name: string;
  code: Json;
  fallback_sms_enabled: boolean;
  fallback_text: string | null;
  media_urls: string[];
  buttons: Json | null;
  status: TemplateStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  org_id: string;
  course_id: string | null;
  contact_id: string;
  last_message_at: string;
  last_direction: string;
  unread_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  org_id: string;
  course_id: string | null;
  contact_id: string;
  direction: 'inbound' | 'outbound';
  kind: string;
  body: string | null;
  media: Json | null;
  action_payload: string | null;
  provider_message_id: string | null;
  provider_conversation_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  org_id: string;
  course_id: string | null;
  event_type: EventType;
  campaign_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  status: string;
  created_by: string | null;
  is_client_visible: boolean;
  created_at: string;
  updated_at: string;
  event_status: EventStatus;
}

// API Response types
export interface AgencyDailyMetric {
  date: string;
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  replied: number;
}

export interface OrgDailyMetric {
  date: string;
  delivered_like: number | null;
  replies: number | null;
}

// Form action types
export interface CreatePromoInput {
  org_id: string;
  course_id: string;
  template_id: string;
  name: string;
  description: string | null;
  scheduled_at: string;
  timezone: string;
}

// Component prop types
export interface CalendarEventDisplay {
  id: string;
  title: string;
  start: string;
  end: string;
}

export interface ConversationListItem {
  id: string;
  org_id: string;
  last_message_at: string;
  unread_count: number;
}

export interface MessageDisplay {
  id: string;
  direction: string;
  body: string | null;
  created_at: string;
}
