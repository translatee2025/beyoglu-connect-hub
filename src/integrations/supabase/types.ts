export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      pet_connections: {
        Row: {
          created_at: string
          friend_pet_id: string
          id: string
          pet_id: string
          status: string
        }
        Insert: {
          created_at?: string
          friend_pet_id: string
          id?: string
          pet_id: string
          status?: string
        }
        Update: {
          created_at?: string
          friend_pet_id?: string
          id?: string
          pet_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_connections_friend_pet_id_fkey"
            columns: ["friend_pet_id"]
            isOneToOne: false
            referencedRelation: "pet_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_connections_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_photos: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          pet_id: string
          photo_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          pet_id: string
          photo_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          pet_id?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_photos_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pet_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_profiles: {
        Row: {
          age_months: number | null
          age_years: number | null
          bio: string | null
          breed: string | null
          created_at: string
          energy_level: string | null
          gender: string | null
          gender_preference: string | null
          id: string
          is_lost: boolean | null
          is_neutered: boolean | null
          lifestyle_tags: string[] | null
          looking_for: string[] | null
          lost_at: string | null
          lost_details: string | null
          lost_location: string | null
          name: string
          neighborhood: string | null
          owner_id: string
          personality_tags:
            | Database["public"]["Enums"]["pet_personality"][]
            | null
          photo_url: string | null
          size: string | null
          size_preference: string[] | null
          species: Database["public"]["Enums"]["pet_species"]
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          age_months?: number | null
          age_years?: number | null
          bio?: string | null
          breed?: string | null
          created_at?: string
          energy_level?: string | null
          gender?: string | null
          gender_preference?: string | null
          id?: string
          is_lost?: boolean | null
          is_neutered?: boolean | null
          lifestyle_tags?: string[] | null
          looking_for?: string[] | null
          lost_at?: string | null
          lost_details?: string | null
          lost_location?: string | null
          name: string
          neighborhood?: string | null
          owner_id: string
          personality_tags?:
            | Database["public"]["Enums"]["pet_personality"][]
            | null
          photo_url?: string | null
          size?: string | null
          size_preference?: string[] | null
          species?: Database["public"]["Enums"]["pet_species"]
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          age_months?: number | null
          age_years?: number | null
          bio?: string | null
          breed?: string | null
          created_at?: string
          energy_level?: string | null
          gender?: string | null
          gender_preference?: string | null
          id?: string
          is_lost?: boolean | null
          is_neutered?: boolean | null
          lifestyle_tags?: string[] | null
          looking_for?: string[] | null
          lost_at?: string | null
          lost_details?: string | null
          lost_location?: string | null
          name?: string
          neighborhood?: string | null
          owner_id?: string
          personality_tags?:
            | Database["public"]["Enums"]["pet_personality"][]
            | null
          photo_url?: string | null
          size?: string | null
          size_preference?: string[] | null
          species?: Database["public"]["Enums"]["pet_species"]
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          neighborhood: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          neighborhood?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          neighborhood?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      pet_personality:
        | "friendly"
        | "energetic"
        | "calm"
        | "shy"
        | "playful"
        | "protective"
        | "curious"
        | "independent"
      pet_species: "dog" | "cat" | "bird" | "rabbit" | "fish" | "other"
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
    Enums: {
      pet_personality: [
        "friendly",
        "energetic",
        "calm",
        "shy",
        "playful",
        "protective",
        "curious",
        "independent",
      ],
      pet_species: ["dog", "cat", "bird", "rabbit", "fish", "other"],
    },
  },
} as const
