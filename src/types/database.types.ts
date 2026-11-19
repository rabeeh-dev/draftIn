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
      profiles: {
        Row: {
          id: string
          name: string
          headline: string | null
          avatar_url: string | null
          username: string | null
          email: string | null
          role: string
          status: string
          preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string
          headline?: string | null
          avatar_url?: string | null
          username?: string | null
          email?: string | null
          role?: string
          status?: string
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          headline?: string | null
          avatar_url?: string | null
          username?: string | null
          email?: string | null
          role?: string
          status?: string
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          id: string
          admin_id: string | null
          admin_email: string | null
          target_user_id: string | null
          target_user_name: string | null
          action: string
          details: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          admin_email?: string | null
          target_user_id?: string | null
          target_user_name?: string | null
          action: string
          details?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          admin_email?: string | null
          target_user_id?: string | null
          target_user_name?: string | null
          action?: string
          details?: string | null
          created_at?: string
        }
        Relationships: []
      }
      drafts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          content_json: Json | null
          version: number
          deleted_at: string | null
          last_saved_at: string | null
          status: 'draft' | 'scheduled' | 'published'
          is_starred: boolean
          tags: string[]
          scheduled_for: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          content?: string
          content_json?: Json | null
          version?: number
          deleted_at?: string | null
          last_saved_at?: string | null
          status?: 'draft' | 'scheduled' | 'published'
          is_starred?: boolean
          tags?: string[]
          scheduled_for?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          content_json?: Json | null
          version?: number
          deleted_at?: string | null
          last_saved_at?: string | null
          status?: 'draft' | 'scheduled' | 'published'
          is_starred?: boolean
          tags?: string[]
          scheduled_for?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'drafts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      draft_versions: {
        Row: {
          id: string
          draft_id: string
          user_id: string
          version_number: number
          title: string
          content: string
          content_json: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          draft_id: string
          user_id: string
          version_number: number
          title: string
          content: string
          content_json?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          draft_id?: string
          user_id?: string
          version_number?: number
          title?: string
          content?: string
          content_json?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'draft_versions_draft_id_fkey'
            columns: ['draft_id']
            isOneToOne: false
            referencedRelation: 'drafts'
            referencedColumns: ['id']
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          status: string
          plan_id: string
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: string
          plan_id?: string
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          plan_id?: string
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_active: {
        Args: {
          check_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      draft_status: 'draft' | 'scheduled' | 'published'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
