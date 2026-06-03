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
          onboarded_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          handle?: string | null;
          default_model?: string | null;
          onboarded_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          handle?: string | null;
          default_model?: string | null;
          onboarded_at?: string | null;
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
          language: string;
          is_demo: boolean;
          visibility: string;
          forked_from_story_id: string | null;
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
          language?: string;
          is_demo?: boolean;
          visibility?: string;
          forked_from_story_id?: string | null;
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
          language?: string;
          is_demo?: boolean;
          visibility?: string;
          forked_from_story_id?: string | null;
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
          title: string;
          content: string;
          summary: string;
          steer: string | null;
          model_used: string;
          created_by: string;
          imported: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          parent_id?: string | null;
          title?: string;
          content: string;
          summary: string;
          steer?: string | null;
          model_used: string;
          created_by: string;
          imported?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          parent_id?: string | null;
          title?: string;
          content?: string;
          summary?: string;
          steer?: string | null;
          model_used?: string;
          created_by?: string;
          imported?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      stars: {
        Row: {
          user_id: string;
          story_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          story_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          story_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      public_profiles: {
        Row: {
          id: string | null;
          handle: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Convenience row aliases used across domains.
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type StoryRow = Database["public"]["Tables"]["stories"]["Row"];
export type NodeRow = Database["public"]["Tables"]["nodes"]["Row"];
export type StarRow = Database["public"]["Tables"]["stars"]["Row"];
