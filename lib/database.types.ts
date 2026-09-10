// Generado a partir del esquema real de Supabase (proyecto vuelve-app).
// Para regenerar tras una migración nueva: npm run types:supabase
// (requiere `supabase login` con la CLI de Supabase instalada).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      diary_entries: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          entry_date: string
          id: string
          place_name: string | null
          title: string | null
          trip_id: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          entry_date: string
          id?: string
          place_name?: string | null
          title?: string | null
          trip_id: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          entry_date?: string
          id?: string
          place_name?: string | null
          title?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diary_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diary_entries_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          created_at: string
          created_by: string | null
          day_label: string | null
          id: string
          lat: number | null
          lng: number | null
          place_name: string | null
          storage_path: string
          taken_at: string | null
          trip_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          day_label?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          place_name?: string | null
          storage_path: string
          taken_at?: string | null
          trip_id: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          day_label?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          place_name?: string | null
          storage_path?: string
          taken_at?: string | null
          trip_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      moment_memories: {
        Row: {
          memory_id: string
          moment_id: string
        }
        Insert: {
          memory_id: string
          moment_id: string
        }
        Update: {
          memory_id?: string
          moment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moment_memories_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moment_memories_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
        ]
      }
      moments: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_favorite: boolean
          lat: number | null
          lng: number | null
          occurred_at: string | null
          place_name: string | null
          song_title: string | null
          song_url: string | null
          story: string | null
          title: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_favorite?: boolean
          lat?: number | null
          lng?: number | null
          occurred_at?: string | null
          place_name?: string | null
          song_title?: string | null
          song_url?: string | null
          story?: string | null
          title: string
          trip_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_favorite?: boolean
          lat?: number | null
          lng?: number | null
          occurred_at?: string | null
          place_name?: string | null
          song_title?: string | null
          song_url?: string | null
          story?: string | null
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      nfc_tags: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          label: string
          link_type: string
          moment_id: string | null
          owner_id: string
          public_slug: string
          status: string
          tag_uid: string | null
          trip_id: string | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          label: string
          link_type: string
          moment_id?: string | null
          owner_id: string
          public_slug: string
          status?: string
          tag_uid?: string | null
          trip_id?: string | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          label?: string
          link_type?: string
          moment_id?: string | null
          owner_id?: string
          public_slug?: string
          status?: string
          tag_uid?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfc_tags_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfc_tags_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfc_tags_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_premium: boolean
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_premium?: boolean
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_premium?: boolean
          username?: string | null
        }
        Relationships: []
      }
      trip_members: {
        Row: {
          id: string
          invited_email: string | null
          joined_at: string
          role: string
          trip_id: string
          user_id: string | null
        }
        Insert: {
          id?: string
          invited_email?: string | null
          joined_at?: string
          role?: string
          trip_id: string
          user_id?: string | null
        }
        Update: {
          id?: string
          invited_email?: string | null
          joined_at?: string
          role?: string
          trip_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_shares: {
        Row: {
          allow_add_memories: boolean
          public_slug: string | null
          share_mode: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          allow_add_memories?: boolean
          public_slug?: string | null
          share_mode?: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          allow_add_memories?: boolean
          public_slug?: string | null
          share_mode?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_shares_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          country: string | null
          cover_photo_url: string | null
          created_at: string
          destination_summary: string | null
          end_date: string | null
          id: string
          is_favorite: boolean
          owner_id: string
          quote: string | null
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          country?: string | null
          cover_photo_url?: string | null
          created_at?: string
          destination_summary?: string | null
          end_date?: string | null
          id?: string
          is_favorite?: boolean
          owner_id: string
          quote?: string | null
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          country?: string | null
          cover_photo_url?: string | null
          created_at?: string
          destination_summary?: string | null
          end_date?: string | null
          id?: string
          is_favorite?: boolean
          owner_id?: string
          quote?: string | null
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      email_for_username: {
        Args: { username_input: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
