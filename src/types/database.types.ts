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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
