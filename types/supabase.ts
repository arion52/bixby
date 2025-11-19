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
      digest_items: {
        Row: {
          id: string
          date: string
          category: string
          title: string
          summary: string
          source_url: string
          source_name: string | null
          is_favorited: boolean
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          category: string
          title: string
          summary: string
          source_url: string
          source_name?: string | null
          is_favorited?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          category?: string
          title?: string
          summary?: string
          source_url?: string
          source_name?: string | null
          is_favorited?: boolean
          created_at?: string
        }
      }
      digest_runs: {
        Row: {
          id: string
          run_date: string
          status: string | null
          items_fetched: number | null
          items_stored: number | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          run_date: string
          status?: string | null
          items_fetched?: number | null
          items_stored?: number | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          run_date?: string
          status?: string | null
          items_fetched?: number | null
          items_stored?: number | null
          error_message?: string | null
          created_at?: string
        }
      }
    }
  }
}
