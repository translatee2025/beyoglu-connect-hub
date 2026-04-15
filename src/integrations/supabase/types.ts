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
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: []
      }
      classified_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          section: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          section?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          section?: string
          sort_order?: number
        }
        Relationships: []
      }
      classifieds: {
        Row: {
          address: string | null
          category: string | null
          contact_preference: string | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          lat: number | null
          listing_mode: string | null
          lng: number | null
          neighborhood: string | null
          phone: string | null
          photos: string[] | null
          price: string | null
          section: Database["public"]["Enums"]["classified_section"]
          status: Database["public"]["Enums"]["classified_status"]
          title: string
          type: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          contact_preference?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          listing_mode?: string | null
          lng?: number | null
          neighborhood?: string | null
          phone?: string | null
          photos?: string[] | null
          price?: string | null
          section?: Database["public"]["Enums"]["classified_section"]
          status?: Database["public"]["Enums"]["classified_status"]
          title: string
          type?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          contact_preference?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          listing_mode?: string | null
          lng?: number | null
          neighborhood?: string | null
          phone?: string | null
          photos?: string[] | null
          price?: string | null
          section?: Database["public"]["Enums"]["classified_section"]
          status?: Database["public"]["Enums"]["classified_status"]
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          category: string
          cover_photo: string | null
          created_at: string
          created_by: string
          description: string | null
          group_type: string
          id: string
          member_count: number
          name: string
          neighborhood: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          cover_photo?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          group_type?: string
          id?: string
          member_count?: number
          name: string
          neighborhood?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          cover_photo?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          group_type?: string
          id?: string
          member_count?: number
          name?: string
          neighborhood?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          created_at: string
          direction: string | null
          is_active: boolean | null
          is_default: boolean | null
          name: string
          native_name: string
          sort_order: number | null
        }
        Insert: {
          code: string
          created_at?: string
          direction?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          native_name: string
          sort_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          direction?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          native_name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      lost_found_posts: {
        Row: {
          category: string
          contact_preference: string | null
          created_at: string | null
          description: string | null
          id: string
          last_seen_at: string | null
          last_seen_lat: number | null
          last_seen_lng: number | null
          neighborhood: string | null
          phone: string | null
          photo_urls: string[] | null
          resolved_at: string | null
          status: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          category?: string
          contact_preference?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_seen_at?: string | null
          last_seen_lat?: number | null
          last_seen_lng?: number | null
          neighborhood?: string | null
          phone?: string | null
          photo_urls?: string[] | null
          resolved_at?: string | null
          status?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          category?: string
          contact_preference?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_seen_at?: string | null
          last_seen_lat?: number | null
          last_seen_lng?: number | null
          neighborhood?: string | null
          phone?: string | null
          photo_urls?: string[] | null
          resolved_at?: string | null
          status?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      module_settings: {
        Row: {
          icon: string | null
          id: string
          is_enabled: boolean
          label: string
          module_key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          icon?: string | null
          id?: string
          is_enabled?: boolean
          label: string
          module_key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          icon?: string | null
          id?: string
          is_enabled?: boolean
          label?: string
          module_key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      neighbor_help_posts: {
        Row: {
          category: string
          created_at: string
          description: string | null
          help_type: string
          id: string
          neighborhood: string | null
          phone: string | null
          price: string | null
          price_type: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          help_type?: string
          id?: string
          neighborhood?: string | null
          phone?: string | null
          price?: string | null
          price_type?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          help_type?: string
          id?: string
          neighborhood?: string | null
          phone?: string | null
          price?: string | null
          price_type?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
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
      pet_posts: {
        Row: {
          address: string | null
          age_text: string | null
          breed: string | null
          created_at: string
          description: string | null
          gender: string | null
          id: string
          is_offering: boolean | null
          lat: number | null
          lng: number | null
          opening_hours: Json | null
          phone: string | null
          photos: string[] | null
          post_type: Database["public"]["Enums"]["pet_post_type"]
          price: string | null
          species: string | null
          status: Database["public"]["Enums"]["pet_post_status"]
          title: string
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          age_text?: string | null
          breed?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          id?: string
          is_offering?: boolean | null
          lat?: number | null
          lng?: number | null
          opening_hours?: Json | null
          phone?: string | null
          photos?: string[] | null
          post_type: Database["public"]["Enums"]["pet_post_type"]
          price?: string | null
          species?: string | null
          status?: Database["public"]["Enums"]["pet_post_status"]
          title: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          age_text?: string | null
          breed?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          id?: string
          is_offering?: boolean | null
          lat?: number | null
          lng?: number | null
          opening_hours?: Json | null
          phone?: string | null
          photos?: string[] | null
          post_type?: Database["public"]["Enums"]["pet_post_type"]
          price?: string | null
          species?: string | null
          status?: Database["public"]["Enums"]["pet_post_status"]
          title?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
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
          latitude: number | null
          lifestyle_tags: string[] | null
          longitude: number | null
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
          latitude?: number | null
          lifestyle_tags?: string[] | null
          longitude?: number | null
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
          latitude?: number | null
          lifestyle_tags?: string[] | null
          longitude?: number | null
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
          phone: string | null
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
          phone?: string | null
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
          phone?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      reels: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          media_type: string
          media_url: string
          neighborhood: string | null
          user_id: string
          venue_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          media_type?: string
          media_url: string
          neighborhood?: string | null
          user_id: string
          venue_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          neighborhood?: string | null
          user_id?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reels_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      theme_settings: {
        Row: {
          accent_color: string
          background_color: string
          border_color: string
          button_color: string
          card_background: string
          id: string
          nav_color: string
          preset_name: string | null
          primary_color: string
          text_color: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          background_color?: string
          border_color?: string
          button_color?: string
          card_background?: string
          id?: string
          nav_color?: string
          preset_name?: string | null
          primary_color?: string
          text_color?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          background_color?: string
          border_color?: string
          button_color?: string
          card_background?: string
          id?: string
          nav_color?: string
          preset_name?: string | null
          primary_color?: string
          text_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      translations: {
        Row: {
          created_at: string
          id: string
          language_code: string
          translation_key: string
          translation_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          language_code: string
          translation_key: string
          translation_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          language_code?: string
          translation_key?: string
          translation_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      user_friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venue_analytics: {
        Row: {
          call_taps: number | null
          date: string
          direction_taps: number | null
          id: string
          message_taps: number | null
          profile_views: number | null
          saves_count: number | null
          venue_id: string
        }
        Insert: {
          call_taps?: number | null
          date: string
          direction_taps?: number | null
          id?: string
          message_taps?: number | null
          profile_views?: number | null
          saves_count?: number | null
          venue_id: string
        }
        Update: {
          call_taps?: number | null
          date?: string
          direction_taps?: number | null
          id?: string
          message_taps?: number | null
          profile_views?: number | null
          saves_count?: number | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_analytics_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_attribute_definitions: {
        Row: {
          attribute_key: string
          field_type: string
          id: string
          is_required: boolean | null
          label: string
          options: Json | null
          sort_order: number | null
          venue_type_id: string
        }
        Insert: {
          attribute_key: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          label: string
          options?: Json | null
          sort_order?: number | null
          venue_type_id: string
        }
        Update: {
          attribute_key?: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          label?: string
          options?: Json | null
          sort_order?: number | null
          venue_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_attribute_definitions_venue_type_id_fkey"
            columns: ["venue_type_id"]
            isOneToOne: false
            referencedRelation: "venue_types"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_attributes: {
        Row: {
          attribute_key: string
          id: string
          value: string | null
          venue_id: string
        }
        Insert: {
          attribute_key: string
          id?: string
          value?: string | null
          venue_id: string
        }
        Update: {
          attribute_key?: string
          id?: string
          value?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_attributes_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_claims: {
        Row: {
          created_at: string | null
          document_url: string | null
          id: string
          phone: string | null
          reviewed_by: string | null
          role_at_venue: string | null
          status: string | null
          user_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string | null
          document_url?: string | null
          id?: string
          phone?: string | null
          reviewed_by?: string | null
          role_at_venue?: string | null
          status?: string | null
          user_id: string
          venue_id: string
        }
        Update: {
          created_at?: string | null
          document_url?: string | null
          id?: string
          phone?: string | null
          reviewed_by?: string | null
          role_at_venue?: string | null
          status?: string | null
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_claims_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_deals: {
        Row: {
          created_at: string | null
          description: string | null
          discount_label: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          qr_code_token: string | null
          title: string
          venue_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_label?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          qr_code_token?: string | null
          title: string
          venue_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_label?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          qr_code_token?: string | null
          title?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_deals_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_menu_items: {
        Row: {
          currency: string | null
          description: string | null
          id: string
          is_available: boolean | null
          item_name: string
          photo: string | null
          price: number | null
          section_label: string | null
          sort_order: number | null
          venue_id: string
        }
        Insert: {
          currency?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          item_name: string
          photo?: string | null
          price?: number | null
          section_label?: string | null
          sort_order?: number | null
          venue_id: string
        }
        Update: {
          currency?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          item_name?: string
          photo?: string | null
          price?: number | null
          section_label?: string | null
          sort_order?: number | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_menu_items_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_reviews: {
        Row: {
          body: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          photos: string[] | null
          rating: number
          reply_at: string | null
          reply_body: string | null
          user_id: string
          venue_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          photos?: string[] | null
          rating: number
          reply_at?: string | null
          reply_body?: string | null
          user_id: string
          venue_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          photos?: string[] | null
          rating?: number
          reply_at?: string | null
          reply_body?: string | null
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_reviews_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_saves: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          venue_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_saves_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_type_groups: {
        Row: {
          color_accent: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          color_accent?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          color_accent?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      venue_types: {
        Row: {
          default_attributes: Json | null
          group_id: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          default_attributes?: Json | null
          group_id: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          default_attributes?: Json | null
          group_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_types_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "venue_type_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          claimed_by_user_id: string | null
          cover_photo: string | null
          created_at: string | null
          created_by_user_id: string | null
          description: string | null
          email: string | null
          hours: Json | null
          id: string
          is_claimed: boolean | null
          is_verified: boolean | null
          lat: number | null
          lng: number | null
          logo: string | null
          name: string
          neighborhood: string | null
          phone: string | null
          photos: string[] | null
          rating_avg: number | null
          review_count: number | null
          slug: string | null
          status: string | null
          updated_at: string | null
          venue_type_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          claimed_by_user_id?: string | null
          cover_photo?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          email?: string | null
          hours?: Json | null
          id?: string
          is_claimed?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          logo?: string | null
          name: string
          neighborhood?: string | null
          phone?: string | null
          photos?: string[] | null
          rating_avg?: number | null
          review_count?: number | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
          venue_type_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          claimed_by_user_id?: string | null
          cover_photo?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          email?: string | null
          hours?: Json | null
          id?: string
          is_claimed?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          logo?: string | null
          name?: string
          neighborhood?: string | null
          phone?: string | null
          photos?: string[] | null
          rating_avg?: number | null
          review_count?: number | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
          venue_type_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venues_venue_type_id_fkey"
            columns: ["venue_type_id"]
            isOneToOne: false
            referencedRelation: "venue_types"
            referencedColumns: ["id"]
          },
        ]
      }
      wall_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          photos: string[] | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          photos?: string[] | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          photos?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "vendor" | "user"
      classified_section: "classifieds" | "rental" | "parking"
      classified_status: "active" | "sold" | "closed"
      pet_personality:
        | "friendly"
        | "energetic"
        | "calm"
        | "shy"
        | "playful"
        | "protective"
        | "curious"
        | "independent"
      pet_post_status: "active" | "resolved" | "closed"
      pet_post_type:
        | "adoption"
        | "pet_sitting"
        | "friend"
        | "lost"
        | "found"
        | "shop"
        | "vet"
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
      app_role: ["admin", "moderator", "vendor", "user"],
      classified_section: ["classifieds", "rental", "parking"],
      classified_status: ["active", "sold", "closed"],
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
      pet_post_status: ["active", "resolved", "closed"],
      pet_post_type: [
        "adoption",
        "pet_sitting",
        "friend",
        "lost",
        "found",
        "shop",
        "vet",
      ],
      pet_species: ["dog", "cat", "bird", "rabbit", "fish", "other"],
    },
  },
} as const
