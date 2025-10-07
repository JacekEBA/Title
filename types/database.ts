export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: any;
        Insert: any;
        Update: any;
      };
      calendar_events: {
        Row: any;
        Insert: any;
        Update: any;
      };
      send_jobs: {
        Row: any;
        Insert: any;
        Update: any;
      };
      // Add other tables as needed
      [key: string]: {
        Row: any;
        Insert: any;
        Update: any;
      };
    };
    Views: Record<string, any>;
    Functions: Record<string, any>;
    Enums: Record<string, any>;
  };
}
