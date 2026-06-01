// Hand-authored to mirror supabase/migrations/0001_init.sql, in the shape
// `supabase gen types typescript` produces. Regenerate with `npm run db:types`
// once a Supabase project is linked; this file is a drop-in placeholder.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          handle: string | null;
          default_model: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          handle?: string | null;
          default_model?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          handle?: string | null;
          default_model?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      stories: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          premise: string;
          genre: string | null;
          tone: string | null;
          root_node_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          premise: string;
          genre?: string | null;
          tone?: string | null;
          root_node_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          premise?: string;
          genre?: string | null;
          tone?: string | null;
          root_node_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      nodes: {
        Row: {
          id: string;
          story_id: string;
          parent_id: string | null;
          content: string;
          summary: string;
          steer: string | null;
          model_used: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          parent_id?: string | null;
          content: string;
          summary: string;
          steer?: string | null;
          model_used: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          parent_id?: string | null;
          content?: string;
          summary?: string;
          steer?: string | null;
          model_used?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Convenience row aliases used across domains.
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type StoryRow = Database["public"]["Tables"]["stories"]["Row"];
export type NodeRow = Database["public"]["Tables"]["nodes"]["Row"];
