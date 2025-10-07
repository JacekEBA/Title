// Database types
export type UserRole = 'owner' | 'agency_staff' | 'client_admin' | 'client_viewer';

export type MembershipRole = 'owner' | 'agency_staff' | 'client_admin' | 'client_viewer';

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'completed' | 'cancelled';

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export type ConsentStatus = 'granted' | 'denied' | 'unknown';

// Common entities
export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  org_id: string;
  name: string;
  timezone: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  region?: string | null;
}

export interface RcsTemplate {
  id: string;
  org_id: string;
  name: string;
  code: any; // JSONB
  status: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  org_id: string;
  course_id: string;
  template_id: string;
  name: string;
  description?: string | null;
  scheduled_at: string;
  timezone: string;
  status: CampaignStatus;
}

export interface Contact {
  id: string;
  org_id: string;
  course_id?: string | null;
  name?: string | null;
  phone: string;
  email?: string | null;
  consent: ConsentStatus;
  opted_out_at?: string | null;
}

export interface Conversation {
  id: string;
  org_id: string;
  course_id?: string | null;
  contact_id: string;
  last_message_at: string;
  last_direction: 'inbound' | 'outbound';
  unread_count: number;
  status: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  org_id: string;
  contact_id: string;
  direction: 'inbound' | 'outbound';
  kind: string;
  body?: string | null;
  sent_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface Profile {
  user_id: string;
  org_id?: string | null;
  role: UserRole;
  full_name?: string | null;
  timezone?: string | null;
  phone?: string | null;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface DailyMetrics {
  date: string;
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  replied: number;
  bookings: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time?: string | null;
  org_id: string;
  course_id?: string | null;
  campaign_id?: string | null;
}

// Form input types
export interface CreateCampaignInput {
  org_id: string;
  course_id: string;
  template_id: string;
  name: string;
  description?: string | null;
  scheduled_at: string;
  timezone: string;
}

export interface SendMessageInput {
  conversation_id: string;
  body: string;
}
