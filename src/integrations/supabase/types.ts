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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      app_options: {
        Row: {
          created_at: string
          emoji: string | null
          group_key: string
          id: string
          is_active: boolean
          label_en: string
          label_tr: string
          metadata: Json | null
          sort_order: number
          value_key: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          group_key: string
          id?: string
          is_active?: boolean
          label_en: string
          label_tr: string
          metadata?: Json | null
          sort_order?: number
          value_key: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          group_key?: string
          id?: string
          is_active?: boolean
          label_en?: string
          label_tr?: string
          metadata?: Json | null
          sort_order?: number
          value_key?: string
        }
        Relationships: []
      }
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
      breeds: {
        Row: {
          id: string
          is_popular: boolean
          name_en: string
          name_tr: string
          species_id: string
        }
        Insert: {
          id?: string
          is_popular?: boolean
          name_en: string
          name_tr: string
          species_id: string
        }
        Update: {
          id?: string
          is_popular?: boolean
          name_en?: string
          name_tr?: string
          species_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "breeds_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
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
          available_from: string | null
          category: string | null
          contact_preference: string | null
          created_at: string
          currency: string | null
          description: string | null
          floor_number: number | null
          id: string
          is_furnished: boolean | null
          lat: number | null
          latitude: number | null
          listing_mode: string | null
          listing_type: string | null
          lng: number | null
          longitude: number | null
          neighborhood: string | null
          parking_type: string | null
          pets_allowed: boolean | null
          phone: string | null
          photos: string[] | null
          price: string | null
          room_type: string | null
          section: Database["public"]["Enums"]["classified_section"]
          size_m2: number | null
          status: Database["public"]["Enums"]["classified_status"]
          title: string
          total_floors: number | null
          type: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          available_from?: string | null
          category?: string | null
          contact_preference?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          floor_number?: number | null
          id?: string
          is_furnished?: boolean | null
          lat?: number | null
          latitude?: number | null
          listing_mode?: string | null
          listing_type?: string | null
          lng?: number | null
          longitude?: number | null
          neighborhood?: string | null
          parking_type?: string | null
          pets_allowed?: boolean | null
          phone?: string | null
          photos?: string[] | null
          price?: string | null
          room_type?: string | null
          section?: Database["public"]["Enums"]["classified_section"]
          size_m2?: number | null
          status?: Database["public"]["Enums"]["classified_status"]
          title: string
          total_floors?: number | null
          type?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          available_from?: string | null
          category?: string | null
          contact_preference?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          floor_number?: number | null
          id?: string
          is_furnished?: boolean | null
          lat?: number | null
          latitude?: number | null
          listing_mode?: string | null
          listing_type?: string | null
          lng?: number | null
          longitude?: number | null
          neighborhood?: string | null
          parking_type?: string | null
          pets_allowed?: boolean | null
          phone?: string | null
          photos?: string[] | null
          price?: string | null
          room_type?: string | null
          section?: Database["public"]["Enums"]["classified_section"]
          size_m2?: number | null
          status?: Database["public"]["Enums"]["classified_status"]
          title?: string
          total_floors?: number | null
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
          group_id: string | null
          id: string
          last_message_at: string | null
          status: string | null
          type: string | null
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          last_message_at?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          last_message_at?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: []
      }
      districts: {
        Row: {
          city: string | null
          created_at: string | null
          id: string
          name: string
          slug: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          id?: string
          name: string
          slug?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          id?: string
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      event_attendees: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          category: string | null
          cover_photo: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          end_at: string | null
          id: string
          is_free: boolean | null
          lat: number | null
          lng: number | null
          max_attendees: number | null
          neighborhood: string | null
          photos: string[] | null
          price: number | null
          start_at: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
          venue_name: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          cover_photo?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          is_free?: boolean | null
          lat?: number | null
          lng?: number | null
          max_attendees?: number | null
          neighborhood?: string | null
          photos?: string[] | null
          price?: number | null
          start_at: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          venue_name?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          cover_photo?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          is_free?: boolean | null
          lat?: number | null
          lng?: number | null
          max_attendees?: number | null
          neighborhood?: string | null
          photos?: string[] | null
          price?: number | null
          start_at?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          venue_name?: string | null
        }
        Relationships: []
      }
      families: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          district_id: string | null
          id: string
          is_active: boolean | null
          neighborhood: string | null
          photos: string[] | null
          post_type: string
          price: number | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          district_id?: string | null
          id?: string
          is_active?: boolean | null
          neighborhood?: string | null
          photos?: string[] | null
          post_type: string
          price?: number | null
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          district_id?: string | null
          id?: string
          is_active?: boolean | null
          neighborhood?: string | null
          photos?: string[] | null
          post_type?: string
          price?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "families_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
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
          district_id: string | null
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
          district_id?: string | null
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
          district_id?: string | null
          group_type?: string
          id?: string
          member_count?: number
          name?: string
          neighborhood?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
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
          district_id: string | null
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
          district_id?: string | null
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
          district_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "lost_found_posts_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
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
          district_id: string | null
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
          district_id?: string | null
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
          district_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "neighbor_help_posts_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          id: string
          link: string | null
          read: boolean | null
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          link?: string | null
          read?: boolean | null
          title?: string | null
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          link?: string | null
          read?: boolean | null
          title?: string | null
          type?: string
          user_id?: string
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
          age_months: number | null
          age_text: string | null
          age_years: number | null
          available_days: string[] | null
          breed: string | null
          created_at: string
          description: string | null
          district_id: string | null
          energy_level: string | null
          gender: string | null
          good_with_children: boolean | null
          good_with_pets: boolean | null
          id: string
          is_neutered: boolean | null
          is_offering: boolean | null
          is_vaccinated: boolean | null
          lat: number | null
          lng: number | null
          opening_hours: Json | null
          phone: string | null
          photos: string[] | null
          post_type: Database["public"]["Enums"]["pet_post_type"]
          price: string | null
          price_type: string | null
          service_type: string | null
          size: string | null
          species: string | null
          status: Database["public"]["Enums"]["pet_post_status"]
          title: string
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          age_months?: number | null
          age_text?: string | null
          age_years?: number | null
          available_days?: string[] | null
          breed?: string | null
          created_at?: string
          description?: string | null
          district_id?: string | null
          energy_level?: string | null
          gender?: string | null
          good_with_children?: boolean | null
          good_with_pets?: boolean | null
          id?: string
          is_neutered?: boolean | null
          is_offering?: boolean | null
          is_vaccinated?: boolean | null
          lat?: number | null
          lng?: number | null
          opening_hours?: Json | null
          phone?: string | null
          photos?: string[] | null
          post_type: Database["public"]["Enums"]["pet_post_type"]
          price?: string | null
          price_type?: string | null
          service_type?: string | null
          size?: string | null
          species?: string | null
          status?: Database["public"]["Enums"]["pet_post_status"]
          title: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          age_months?: number | null
          age_text?: string | null
          age_years?: number | null
          available_days?: string[] | null
          breed?: string | null
          created_at?: string
          description?: string | null
          district_id?: string | null
          energy_level?: string | null
          gender?: string | null
          good_with_children?: boolean | null
          good_with_pets?: boolean | null
          id?: string
          is_neutered?: boolean | null
          is_offering?: boolean | null
          is_vaccinated?: boolean | null
          lat?: number | null
          lng?: number | null
          opening_hours?: Json | null
          phone?: string | null
          photos?: string[] | null
          post_type?: Database["public"]["Enums"]["pet_post_type"]
          price?: string | null
          price_type?: string | null
          service_type?: string | null
          size?: string | null
          species?: string | null
          status?: Database["public"]["Enums"]["pet_post_status"]
          title?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_posts_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
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
          breed_id: string | null
          created_at: string
          district_id: string | null
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
          photos: string[] | null
          size: string | null
          size_preference: string[] | null
          species: Database["public"]["Enums"]["pet_species"]
          species_id: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          age_months?: number | null
          age_years?: number | null
          bio?: string | null
          breed?: string | null
          breed_id?: string | null
          created_at?: string
          district_id?: string | null
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
          photos?: string[] | null
          size?: string | null
          size_preference?: string[] | null
          species?: Database["public"]["Enums"]["pet_species"]
          species_id?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          age_months?: number | null
          age_years?: number | null
          bio?: string | null
          breed?: string | null
          breed_id?: string | null
          created_at?: string
          district_id?: string | null
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
          photos?: string[] | null
          size?: string | null
          size_preference?: string[] | null
          species?: Database["public"]["Enums"]["pet_species"]
          species_id?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_profiles_breed_id_fkey"
            columns: ["breed_id"]
            isOneToOne: false
            referencedRelation: "breeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_profiles_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_profiles_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_sitting_posts: {
        Row: {
          available_days: string[] | null
          created_at: string | null
          description: string | null
          district_id: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          listing_type: string
          longitude: number | null
          neighborhood: string | null
          photos: string[] | null
          price: number | null
          price_type: string | null
          service_type: string
          species_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_days?: string[] | null
          created_at?: string | null
          description?: string | null
          district_id?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          listing_type: string
          longitude?: number | null
          neighborhood?: string | null
          photos?: string[] | null
          price?: number | null
          price_type?: string | null
          service_type: string
          species_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_days?: string[] | null
          created_at?: string | null
          description?: string | null
          district_id?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          listing_type?: string
          longitude?: number | null
          neighborhood?: string | null
          photos?: string[] | null
          price?: number | null
          price_type?: string | null
          service_type?: string
          species_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_sitting_posts_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_sitting_posts_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "species"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_public: boolean
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          district_id: string | null
          gender: string | null
          id: string
          language_preference: string | null
          messages_public: boolean
          neighborhood: string | null
          photo_public: boolean
          updated_at: string
          user_id: string
          username: string | null
          verified: boolean | null
        }
        Insert: {
          age_public?: boolean
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          district_id?: string | null
          gender?: string | null
          id?: string
          language_preference?: string | null
          messages_public?: boolean
          neighborhood?: string | null
          photo_public?: boolean
          updated_at?: string
          user_id: string
          username?: string | null
          verified?: boolean | null
        }
        Update: {
          age_public?: boolean
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          district_id?: string | null
          gender?: string | null
          id?: string
          language_preference?: string | null
          messages_public?: boolean
          neighborhood?: string | null
          photo_public?: boolean
          updated_at?: string
          user_id?: string
          username?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      reels: {
        Row: {
          caption: string | null
          created_at: string
          district_id: string | null
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
          district_id?: string | null
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
          district_id?: string | null
          id?: string
          media_type?: string
          media_url?: string
          neighborhood?: string | null
          user_id?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reels_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reels_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          actioned_by: string | null
          admin_note: string | null
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          reason: string
          reporter_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actioned_by?: string | null
          admin_note?: string | null
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actioned_by?: string | null
          admin_note?: string | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      species: {
        Row: {
          display_order: number
          emoji: string
          id: string
          name_en: string
          name_tr: string
        }
        Insert: {
          display_order?: number
          emoji: string
          id?: string
          name_en: string
          name_tr: string
        }
        Update: {
          display_order?: number
          emoji?: string
          id?: string
          name_en?: string
          name_tr?: string
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
      user_contact_info: {
        Row: {
          age: number | null
          created_at: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
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
      user_privacy_settings: {
        Row: {
          allow_messages: string | null
          created_at: string | null
          id: string
          show_age: boolean | null
          show_gender: boolean | null
          show_neighborhood: boolean | null
          show_photo: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_messages?: string | null
          created_at?: string | null
          id?: string
          show_age?: boolean | null
          show_gender?: boolean | null
          show_neighborhood?: boolean | null
          show_photo?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_messages?: string | null
          created_at?: string | null
          id?: string
          show_age?: boolean | null
          show_gender?: boolean | null
          show_neighborhood?: boolean | null
          show_photo?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          reviewer_id: string
          target_user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          reviewer_id: string
          target_user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          reviewer_id?: string
          target_user_id?: string
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
          name_tr: string | null
          sort_order: number | null
        }
        Insert: {
          default_attributes?: Json | null
          group_id: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_tr?: string | null
          sort_order?: number | null
        }
        Update: {
          default_attributes?: Json | null
          group_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_tr?: string | null
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
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      wall_posts: {
        Row: {
          content: string
          created_at: string
          district_id: string | null
          group_id: string | null
          id: string
          photos: string[] | null
          status: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          district_id?: string | null
          group_id?: string | null
          id?: string
          photos?: string[] | null
          status?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          district_id?: string | null
          group_id?: string | null
          id?: string
          photos?: string[] | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wall_posts_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wall_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "admin" | "moderator" | "vendor" | "user" | "banned"
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
      app_role: ["admin", "moderator", "vendor", "user", "banned"],
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
