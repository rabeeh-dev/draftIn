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
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string
          headline?: string | null
          avatar_url?: string | null
          username?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          headline?: string | null
          avatar_url?: string | null
          username?: string | null
          created_at?: string
          updated_at?: string
        }
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
      }
    }
  }
}
