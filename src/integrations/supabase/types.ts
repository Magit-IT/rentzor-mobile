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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      balance_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string | null
          description: string | null
          id: string
          initiated_by: string | null
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string | null
          description?: string | null
          id?: string
          initiated_by?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          description?: string | null
          id?: string
          initiated_by?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "balance_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_name: string
          category: Database["public"]["Enums"]["blog_category"]
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image_alt: string | null
          featured_image_url: string | null
          id: string
          locale: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          author_name?: string
          category?: Database["public"]["Enums"]["blog_category"]
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_alt?: string | null
          featured_image_url?: string | null
          id?: string
          locale?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          author_name?: string
          category?: Database["public"]["Enums"]["blog_category"]
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_alt?: string | null
          featured_image_url?: string | null
          id?: string
          locale?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          actual_pickup_date: string | null
          actual_return_date: string | null
          admin_compensation: number | null
          cancelled_by: string | null
          cancelled_from_status: string | null
          compensation_reason: string | null
          confirmed_at: string | null
          contract_accepted_at: string | null
          created_at: string | null
          deposit_amount: number | null
          dispute_reason: string | null
          dispute_status: string | null
          disputed_at: string | null
          dropoff_time: string | null
          end_date: string
          id: string
          item_id: string | null
          last_overdue_charge_date: string | null
          overdue_fee: number | null
          owner_id: string | null
          owner_share_rate: number | null
          pickup_photos: string[] | null
          pickup_time: string | null
          rejection_reason: string | null
          rental_cost: number | null
          renter_id: string | null
          resolution_notes: string | null
          return_photos: string[] | null
          service_fee: number | null
          start_date: string
          status: string | null
          stripe_payment_intent_id: string | null
          total_cost: number | null
          total_days: number | null
        }
        Insert: {
          actual_pickup_date?: string | null
          actual_return_date?: string | null
          admin_compensation?: number | null
          cancelled_by?: string | null
          cancelled_from_status?: string | null
          compensation_reason?: string | null
          confirmed_at?: string | null
          contract_accepted_at?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          dispute_reason?: string | null
          dispute_status?: string | null
          disputed_at?: string | null
          dropoff_time?: string | null
          end_date: string
          id?: string
          item_id?: string | null
          last_overdue_charge_date?: string | null
          overdue_fee?: number | null
          owner_id?: string | null
          owner_share_rate?: number | null
          pickup_photos?: string[] | null
          pickup_time?: string | null
          rejection_reason?: string | null
          rental_cost?: number | null
          renter_id?: string | null
          resolution_notes?: string | null
          return_photos?: string[] | null
          service_fee?: number | null
          start_date: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_cost?: number | null
          total_days?: number | null
        }
        Update: {
          actual_pickup_date?: string | null
          actual_return_date?: string | null
          admin_compensation?: number | null
          cancelled_by?: string | null
          cancelled_from_status?: string | null
          compensation_reason?: string | null
          confirmed_at?: string | null
          contract_accepted_at?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          dispute_reason?: string | null
          dispute_status?: string | null
          disputed_at?: string | null
          dropoff_time?: string | null
          end_date?: string
          id?: string
          item_id?: string | null
          last_overdue_charge_date?: string | null
          overdue_fee?: number | null
          owner_id?: string | null
          owner_share_rate?: number | null
          pickup_photos?: string[] | null
          pickup_time?: string | null
          rejection_reason?: string | null
          rental_cost?: number | null
          renter_id?: string | null
          resolution_notes?: string | null
          return_photos?: string[] | null
          service_fee?: number | null
          start_date?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          total_cost?: number | null
          total_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "public_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          icon_name: string
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          icon_name: string
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          icon_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      category_search_terms: {
        Row: {
          category_slug: string
          id: number
          language: string
          subcategory_slug: string | null
          term: string
        }
        Insert: {
          category_slug: string
          id?: number
          language: string
          subcategory_slug?: string | null
          term: string
        }
        Update: {
          category_slug?: string
          id?: number
          language?: string
          subcategory_slug?: string | null
          term?: string
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform?: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "public_items"
            referencedColumns: ["id"]
          },
        ]
      }
      item_images: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          image_order: number | null
          image_type: string | null
          image_url: string
          is_primary: boolean | null
          item_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image_order?: number | null
          image_type?: string | null
          image_url: string
          is_primary?: boolean | null
          item_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image_order?: number | null
          image_type?: string | null
          image_url?: string
          is_primary?: boolean | null
          item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_images_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_images_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "public_items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          available: boolean | null
          category: string
          created_at: string | null
          deposit_amount: number
          description: string | null
          equipment_value: number
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          owner_id: string | null
          pickup_instructions: string | null
          pickup_times: string[] | null
          price_per_day: number
          rejection_reason: string | null
          slug: string
          status: string | null
          subcategory: string | null
          title: string
          verified: boolean | null
        }
        Insert: {
          available?: boolean | null
          category: string
          created_at?: string | null
          deposit_amount: number
          description?: string | null
          equipment_value: number
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          owner_id?: string | null
          pickup_instructions?: string | null
          pickup_times?: string[] | null
          price_per_day: number
          rejection_reason?: string | null
          slug: string
          status?: string | null
          subcategory?: string | null
          title: string
          verified?: boolean | null
        }
        Update: {
          available?: boolean | null
          category?: string
          created_at?: string | null
          deposit_amount?: number
          description?: string | null
          equipment_value?: number
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          owner_id?: string | null
          pickup_instructions?: string | null
          pickup_times?: string[] | null
          price_per_day?: number
          rejection_reason?: string | null
          slug?: string
          status?: string | null
          subcategory?: string | null
          title?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      myid_verifications: {
        Row: {
          birth_date: string | null
          birth_place: string | null
          citizenship: string | null
          completed_at: string | null
          created_at: string | null
          district: string | null
          doc_type: string | null
          expiry_date: string | null
          first_name: string | null
          first_name_en: string | null
          gender: string | null
          id: string
          issued_by: string | null
          issued_date: string | null
          last_name: string | null
          last_name_en: string | null
          middle_name: string | null
          nationality: string | null
          pass_data: string | null
          permanent_address: string | null
          pinfl: string | null
          region: string | null
          status: string | null
          temporary_address: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          telegram_attempt_count: number | null
          telegram_error: string | null
          telegram_sent_at: string | null
          telegram_status: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          telegram_attempt_count?: number | null
          telegram_error?: string | null
          telegram_sent_at?: string | null
          telegram_status?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          telegram_attempt_count?: number | null
          telegram_error?: string | null
          telegram_sent_at?: string | null
          telegram_status?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paylov_tokens: {
        Row: {
          access_token: string
          access_token_expires_at: string
          id: number
          refresh_token: string
          refresh_token_expires_at: string
          updated_at: string
        }
        Insert: {
          access_token: string
          access_token_expires_at: string
          id?: number
          refresh_token: string
          refresh_token_expires_at: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          access_token_expires_at?: string
          id?: number
          refresh_token?: string
          refresh_token_expires_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          card_expiry: string
          card_number: string
          created_at: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          card_expiry: string
          card_number: string
          created_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          card_expiry?: string
          card_number?: string
          created_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pending_owner_payouts: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          id: string
          owner_id: string
          payout_type: string | null
          renter_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          id?: string
          owner_id: string
          payout_type?: string | null
          renter_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          id?: string
          owner_id?: string
          payout_type?: string | null
          renter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_owner_payouts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      profile_change_log: {
        Row: {
          changed_at: string | null
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          changed_at?: string | null
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          changed_at?: string | null
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_change_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_change_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auto_confirm_enabled: boolean | null
          available_from_time: string | null
          available_to_time: string | null
          avatar_url: string | null
          balance: number | null
          created_at: string | null
          full_name: string | null
          held_balance: number | null
          id: string
          myid_verified: boolean | null
          oneid_verification_date: string | null
          oneid_verified: boolean | null
          phone: string | null
          rating: number | null
          telegram_chat_id: number | null
          telegram_code_expires_at: string | null
          telegram_language: string | null
          telegram_phone: string | null
          telegram_verification_code: string | null
          telegram_verified: boolean | null
          total_rentals: number | null
          trust_tier: number | null
          verification_date: string | null
          verified: boolean | null
        }
        Insert: {
          auto_confirm_enabled?: boolean | null
          available_from_time?: string | null
          available_to_time?: string | null
          avatar_url?: string | null
          balance?: number | null
          created_at?: string | null
          full_name?: string | null
          held_balance?: number | null
          id: string
          myid_verified?: boolean | null
          oneid_verification_date?: string | null
          oneid_verified?: boolean | null
          phone?: string | null
          rating?: number | null
          telegram_chat_id?: number | null
          telegram_code_expires_at?: string | null
          telegram_language?: string | null
          telegram_phone?: string | null
          telegram_verification_code?: string | null
          telegram_verified?: boolean | null
          total_rentals?: number | null
          trust_tier?: number | null
          verification_date?: string | null
          verified?: boolean | null
        }
        Update: {
          auto_confirm_enabled?: boolean | null
          available_from_time?: string | null
          available_to_time?: string | null
          avatar_url?: string | null
          balance?: number | null
          created_at?: string | null
          full_name?: string | null
          held_balance?: number | null
          id?: string
          myid_verified?: boolean | null
          oneid_verification_date?: string | null
          oneid_verified?: boolean | null
          phone?: string | null
          rating?: number | null
          telegram_chat_id?: number | null
          telegram_code_expires_at?: string | null
          telegram_language?: string | null
          telegram_phone?: string | null
          telegram_verification_code?: string | null
          telegram_verified?: boolean | null
          total_rentals?: number | null
          trust_tier?: number | null
          verification_date?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          item_id: string | null
          rating: number | null
          review_type: string | null
          reviewee_id: string | null
          reviewer_id: string | null
          visibility: string | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          rating?: number | null
          review_type?: string | null
          reviewee_id?: string | null
          reviewer_id?: string | null
          visibility?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          rating?: number | null
          review_type?: string | null
          reviewee_id?: string | null
          reviewer_id?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "public_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_bot_sessions: {
        Row: {
          action: string
          booking_id: string
          created_at: string
          data: Json
          expires_at: string
          id: string
          step: string
          user_id: string
        }
        Insert: {
          action: string
          booking_id: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          step: string
          user_id: string
        }
        Update: {
          action?: string
          booking_id?: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          step?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_bot_sessions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      unavailable_dates: {
        Row: {
          id: string
          item_id: string | null
          reason: string | null
          unavailable_date: string
        }
        Insert: {
          id?: string
          item_id?: string | null
          reason?: string | null
          unavailable_date: string
        }
        Update: {
          id?: string
          item_id?: string | null
          reason?: string | null
          unavailable_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "unavailable_dates_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unavailable_dates_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "public_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cards: {
        Row: {
          bank_id: string | null
          card_name: string | null
          created_at: string
          expire_date: string
          id: string
          is_active: boolean
          masked_number: string
          owner_name: string
          paylov_card_id: string
          user_id: string
          vendor: string
        }
        Insert: {
          bank_id?: string | null
          card_name?: string | null
          created_at?: string
          expire_date: string
          id?: string
          is_active?: boolean
          masked_number: string
          owner_name: string
          paylov_card_id: string
          user_id: string
          vendor: string
        }
        Update: {
          bank_id?: string | null
          card_name?: string | null
          created_at?: string
          expire_date?: string
          id?: string
          is_active?: boolean
          masked_number?: string
          owner_name?: string
          paylov_card_id?: string
          user_id?: string
          vendor?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      payout_requests_masked: {
        Row: {
          admin_notes: string | null
          amount: number | null
          card_expiry: string | null
          card_number: string | null
          created_at: string | null
          id: string | null
          processed_at: string | null
          processed_by: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount?: number | null
          card_expiry?: string | null
          card_number?: never
          created_at?: string | null
          id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number | null
          card_expiry?: string | null
          card_number?: never
          created_at?: string | null
          id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      platform_balance_summary: {
        Row: {
          total_credits: number | null
          total_debits: number | null
          transaction_count: number | null
          transaction_date: string | null
          transaction_type: string | null
        }
        Relationships: []
      }
      public_items: {
        Row: {
          available: boolean | null
          category: string | null
          created_at: string | null
          deposit_amount: number | null
          description: string | null
          equipment_value: number | null
          id: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          owner_id: string | null
          pickup_instructions: string | null
          pickup_times: string[] | null
          price_per_day: number | null
          status: string | null
          subcategory: string | null
          title: string | null
          verified: boolean | null
        }
        Insert: {
          available?: boolean | null
          category?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          description?: string | null
          equipment_value?: number | null
          id?: string | null
          latitude?: never
          location?: string | null
          longitude?: never
          owner_id?: string | null
          pickup_instructions?: string | null
          pickup_times?: string[] | null
          price_per_day?: number | null
          status?: string | null
          subcategory?: string | null
          title?: string | null
          verified?: boolean | null
        }
        Update: {
          available?: boolean | null
          category?: string | null
          created_at?: string | null
          deposit_amount?: number | null
          description?: string | null
          equipment_value?: number | null
          id?: string | null
          latitude?: never
          location?: string | null
          longitude?: never
          owner_id?: string | null
          pickup_instructions?: string | null
          pickup_times?: string[] | null
          price_per_day?: number | null
          status?: string | null
          subcategory?: string | null
          title?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          auto_confirm_enabled: boolean | null
          available_from_time: string | null
          available_to_time: string | null
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          rating: number | null
          total_rentals: number | null
          verified: boolean | null
        }
        Insert: {
          auto_confirm_enabled?: boolean | null
          available_from_time?: string | null
          available_to_time?: string | null
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          rating?: number | null
          total_rentals?: number | null
          verified?: boolean | null
        }
        Update: {
          auto_confirm_enabled?: boolean | null
          available_from_time?: string | null
          available_to_time?: string | null
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          rating?: number | null
          total_rentals?: number | null
          verified?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_process_payout: {
        Args: { p_admin_notes?: string; p_payout_id: string; p_status: string }
        Returns: Json
      }
      admin_search_users: {
        Args: { p_search_term: string }
        Returns: {
          avatar_url: string
          balance: number
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          rating: number
          telegram_verified: boolean
          total_rentals: number
          verified: boolean
        }[]
      }
      admin_top_up_balance: {
        Args: {
          p_amount: number
          p_notes?: string
          p_transaction_reference: string
          p_user_id: string
        }
        Returns: Json
      }
      audit_platform_balance: {
        Args: never
        Returns: {
          discrepancy: number
          expected_balance: number
          is_balanced: boolean
          total_topped_up: number
          total_user_balances: number
          total_withdrawn: number
        }[]
      }
      generate_item_slug: {
        Args: { p_item_id?: string; p_title: string }
        Returns: string
      }
      get_booking_party_phone: {
        Args: { p_other_user_id: string }
        Returns: string
      }
      get_items_by_distance: {
        Args: {
          page_limit?: number
          page_offset?: number
          user_lat: number
          user_lng: number
        }
        Returns: {
          category: string
          deposit_amount: number
          distance_km: number
          id: string
          latitude: number
          location: string
          longitude: number
          owner_id: string
          price_per_day: number
          slug: string
          title: string
          total_count: number
          verified: boolean
        }[]
      }
      get_platform_admin_id: { Args: never; Returns: string }
      get_platform_fee: { Args: { fee_type: string }; Returns: number }
      get_vault_secret: { Args: { secret_name: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      internal_adjust_balance: {
        Args: {
          p_amount: number
          p_description?: string
          p_initiated_by?: string
          p_reference_id?: string
          p_reference_type?: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      is_item_owner: { Args: { profile_id: string }; Returns: boolean }
      owner_open_dispute: {
        Args: { p_booking_id: string; p_dispute_reason: string }
        Returns: undefined
      }
      owner_update_booking_status: {
        Args: {
          p_booking_id: string
          p_new_status: string
          p_rejection_reason?: string
        }
        Returns: undefined
      }
      renter_cancel_booking: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      renter_open_dispute: {
        Args: { p_booking_id: string; p_dispute_reason: string }
        Returns: undefined
      }
      renter_update_booking_photos: {
        Args: {
          p_booking_id: string
          p_photo_type: string
          p_photo_urls: string[]
        }
        Returns: undefined
      }
      renter_update_booking_status: {
        Args: { p_booking_id: string; p_new_status: string }
        Returns: undefined
      }
      search_items: {
        Args: { search_term: string }
        Returns: {
          category: string
          description: string
          id: string
          location: string
          price_per_day: number
          similarity_score: number
          title: string
        }[]
      }
      search_items_enhanced: {
        Args: {
          result_limit?: number
          result_offset?: number
          search_term: string
          similarity_threshold?: number
        }
        Returns: {
          category: string
          description: string
          id: string
          location: string
          match_type: string
          matched_category_name: string
          matched_category_slug: string
          matched_subcategory_name: string
          matched_subcategory_slug: string
          price_per_day: number
          primary_image: string
          similarity_score: number
          subcategory: string
          suggested_correction: string
          title: string
          total_count: number
        }[]
      }
      search_items_smart: {
        Args: { search_term: string; similarity_threshold?: number }
        Returns: {
          category: string
          description: string
          id: string
          location: string
          match_type: string
          price_per_day: number
          similarity_score: number
          subcategory: string
          title: string
        }[]
      }
      service_adjust_balance: {
        Args: {
          p_amount: number
          p_description?: string
          p_reference_id?: string
          p_reference_type?: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "owner" | "renter" | "admin"
      blog_category:
        | "renting_guides"
        | "owner_guides"
        | "product_guides"
        | "local_guides"
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
      app_role: ["owner", "renter", "admin"],
      blog_category: [
        "renting_guides",
        "owner_guides",
        "product_guides",
        "local_guides",
      ],
    },
  },
} as const
