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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievement_badges: {
        Row: {
          auto_award: boolean | null
          badge_key: string
          badge_name: string
          category: Database["public"]["Enums"]["badge_category"]
          created_at: string | null
          description: string | null
          icon_emoji: string | null
          id: string
          is_active: boolean | null
          points_value: number | null
          requirement_type: string | null
          requirement_value: Json | null
          tier: string
        }
        Insert: {
          auto_award?: boolean | null
          badge_key: string
          badge_name: string
          category: Database["public"]["Enums"]["badge_category"]
          created_at?: string | null
          description?: string | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          points_value?: number | null
          requirement_type?: string | null
          requirement_value?: Json | null
          tier: string
        }
        Update: {
          auto_award?: boolean | null
          badge_key?: string
          badge_name?: string
          category?: Database["public"]["Enums"]["badge_category"]
          created_at?: string | null
          description?: string | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          points_value?: number | null
          requirement_type?: string | null
          requirement_value?: Json | null
          tier?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_pinned: boolean | null
          title: string
          updated_at: string | null
          visible_tier_ids: string[] | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          title: string
          updated_at?: string | null
          visible_tier_ids?: string[] | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_pinned?: boolean | null
          title?: string
          updated_at?: string | null
          visible_tier_ids?: string[] | null
        }
        Relationships: []
      }
      app_config: {
        Row: {
          config_key: string
          config_value: string | null
          created_at: string
          description: string | null
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value?: string | null
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string | null
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      app_version: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          updated_at: string | null
          version: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          updated_at?: string | null
          version?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      arc_user_ai_interactions: {
        Row: {
          ab_group: string | null
          attempt_number: number | null
          churn_segment: string | null
          created_at: string
          delivery_status: string | null
          direction: string
          ghl_message_id: string | null
          id: string
          message_content: string | null
          message_type: string
          tone: string | null
          total_score: number | null
          user_id: string
        }
        Insert: {
          ab_group?: string | null
          attempt_number?: number | null
          churn_segment?: string | null
          created_at?: string
          delivery_status?: string | null
          direction?: string
          ghl_message_id?: string | null
          id?: string
          message_content?: string | null
          message_type?: string
          tone?: string | null
          total_score?: number | null
          user_id: string
        }
        Update: {
          ab_group?: string | null
          attempt_number?: number | null
          churn_segment?: string | null
          created_at?: string
          delivery_status?: string | null
          direction?: string
          ghl_message_id?: string | null
          id?: string
          message_content?: string | null
          message_type?: string
          tone?: string | null
          total_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      atp_churn_history: {
        Row: {
          churn_segment: string | null
          community_posts: number | null
          community_reactions: number | null
          days_active: number | null
          days_since_login: number | null
          display_name: string | null
          email: string | null
          id: string
          is_activated: boolean | null
          is_current: boolean
          outreach_priority: number | null
          phone: string | null
          previous_segment: string | null
          raw_score: number | null
          score_brand_leads: number | null
          score_community: number | null
          score_delta: number | null
          score_delta_7d: number | null
          score_onboarding: number | null
          score_recency: number | null
          score_sprints: number | null
          score_tasks: number | null
          score_tier: number | null
          scoring_version: number | null
          snapshot_date: string
          sprints_completed: number | null
          tasks_completed: number | null
          tier_key: string | null
          total_score: number | null
          trend_flag: string | null
          user_id: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          churn_segment?: string | null
          community_posts?: number | null
          community_reactions?: number | null
          days_active?: number | null
          days_since_login?: number | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_activated?: boolean | null
          is_current?: boolean
          outreach_priority?: number | null
          phone?: string | null
          previous_segment?: string | null
          raw_score?: number | null
          score_brand_leads?: number | null
          score_community?: number | null
          score_delta?: number | null
          score_delta_7d?: number | null
          score_onboarding?: number | null
          score_recency?: number | null
          score_sprints?: number | null
          score_tasks?: number | null
          score_tier?: number | null
          scoring_version?: number | null
          snapshot_date?: string
          sprints_completed?: number | null
          tasks_completed?: number | null
          tier_key?: string | null
          total_score?: number | null
          trend_flag?: string | null
          user_id: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          churn_segment?: string | null
          community_posts?: number | null
          community_reactions?: number | null
          days_active?: number | null
          days_since_login?: number | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_activated?: boolean | null
          is_current?: boolean
          outreach_priority?: number | null
          phone?: string | null
          previous_segment?: string | null
          raw_score?: number | null
          score_brand_leads?: number | null
          score_community?: number | null
          score_delta?: number | null
          score_delta_7d?: number | null
          score_onboarding?: number | null
          score_recency?: number | null
          score_sprints?: number | null
          score_tasks?: number | null
          score_tier?: number | null
          scoring_version?: number | null
          snapshot_date?: string
          sprints_completed?: number | null
          tasks_completed?: number | null
          tier_key?: string | null
          total_score?: number | null
          trend_flag?: string | null
          user_id?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: []
      }
      brand_leads: {
        Row: {
          amazon_lead_product_url: string | null
          business_model: string
          category: string | null
          company_brand_name: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          last_email_sent_date: string | null
          notes: string | null
          phone: string | null
          sort_order: number | null
          state: string | null
          status: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          amazon_lead_product_url?: string | null
          business_model?: string
          category?: string | null
          company_brand_name: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_email_sent_date?: string | null
          notes?: string | null
          phone?: string | null
          sort_order?: number | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          amazon_lead_product_url?: string | null
          business_model?: string
          category?: string | null
          company_brand_name?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_email_sent_date?: string | null
          notes?: string | null
          phone?: string | null
          sort_order?: number | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      calendar_calls: {
        Row: {
          call_date: string
          call_link: string
          call_time: string
          created_at: string | null
          created_by: string
          description: string | null
          google_calendar_event_id: string | null
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          recurrence_pattern: Json | null
          series_id: string | null
          timezone: string
          title: string
          updated_at: string | null
          visible_tier_ids: string[] | null
          visible_tiers: string[] | null
        }
        Insert: {
          call_date: string
          call_link: string
          call_time: string
          created_at?: string | null
          created_by: string
          description?: string | null
          google_calendar_event_id?: string | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          recurrence_pattern?: Json | null
          series_id?: string | null
          timezone?: string
          title: string
          updated_at?: string | null
          visible_tier_ids?: string[] | null
          visible_tiers?: string[] | null
        }
        Update: {
          call_date?: string
          call_link?: string
          call_time?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          google_calendar_event_id?: string | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          recurrence_pattern?: Json | null
          series_id?: string | null
          timezone?: string
          title?: string
          updated_at?: string | null
          visible_tier_ids?: string[] | null
          visible_tiers?: string[] | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string
          event_type: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date: string
          event_type?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string
          event_type?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      call_recordings: {
        Row: {
          additional_links: Json | null
          created_at: string | null
          created_by: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          recorded_date: string
          recorded_time: string | null
          recording_url: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          visible_tier_ids: string[] | null
          visible_tiers: string[] | null
        }
        Insert: {
          additional_links?: Json | null
          created_at?: string | null
          created_by: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          recorded_date: string
          recorded_time?: string | null
          recording_url: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          visible_tier_ids?: string[] | null
          visible_tiers?: string[] | null
        }
        Update: {
          additional_links?: Json | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          recorded_date?: string
          recorded_time?: string | null
          recording_url?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          visible_tier_ids?: string[] | null
          visible_tiers?: string[] | null
        }
        Relationships: []
      }
      call_rsvps: {
        Row: {
          call_id: string
          created_at: string | null
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          call_id: string
          created_at?: string | null
          id?: string
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          call_id?: string
          created_at?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_rsvps_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calendar_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_churn_risk_segments"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "call_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_atp_sessions: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_active: boolean
          last_message_at: string
          message_count: number
          phone: string | null
          session_end: string | null
          session_id: string | null
          session_start: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          last_message_at?: string
          message_count?: number
          phone?: string | null
          session_end?: string | null
          session_id?: string | null
          session_start?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          last_message_at?: string
          message_count?: number
          phone?: string | null
          session_end?: string | null
          session_id?: string | null
          session_start?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      client_action_items: {
        Row: {
          client_user_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          due_date: string | null
          id: string
          is_completed: boolean
          text: string
        }
        Insert: {
          client_user_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          due_date?: string | null
          id?: string
          is_completed?: boolean
          text: string
        }
        Update: {
          client_user_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          due_date?: string | null
          id?: string
          is_completed?: boolean
          text?: string
        }
        Relationships: []
      }
      client_internal_notes: {
        Row: {
          author_id: string
          author_name: string
          client_user_id: string
          created_at: string | null
          id: string
          note: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          author_name: string
          client_user_id: string
          created_at?: string | null
          id?: string
          note: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          author_name?: string
          client_user_id?: string
          created_at?: string | null
          id?: string
          note?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      community_blocked_users: {
        Row: {
          blocked_at: string | null
          blocked_by: string
          created_at: string | null
          id: string
          is_active: boolean | null
          reason: string
          unblocked_at: string | null
          user_id: string
        }
        Insert: {
          blocked_at?: string | null
          blocked_by: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reason: string
          unblocked_at?: string | null
          user_id: string
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string
          unblocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      community_channels: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          icon_emoji: string | null
          id: string
          is_active: boolean | null
          is_pinned: boolean | null
          is_read_only: boolean | null
          name: string
          pin_order: number | null
          updated_at: string | null
          visible_tier_ids: string[] | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          is_read_only?: boolean | null
          name: string
          pin_order?: number | null
          updated_at?: string | null
          visible_tier_ids?: string[] | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_pinned?: boolean | null
          is_read_only?: boolean | null
          name?: string
          pin_order?: number | null
          updated_at?: string | null
          visible_tier_ids?: string[] | null
        }
        Relationships: []
      }
      community_dm_conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      community_dm_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_dm_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "community_dm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_dm_read_status: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          last_read_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_dm_read_status_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "community_dm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          ai_flagged: boolean | null
          attachments: Json | null
          channel_id: string | null
          content: string
          created_at: string | null
          dm_conversation_id: string | null
          flag_reason: string | null
          flagged_by: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          is_flagged: boolean | null
          is_hidden: boolean | null
          is_pinned: boolean | null
          mentions: string[] | null
          moderation_status: string | null
          parent_message_id: string | null
          pinned_at: string | null
          pinned_by: string | null
          post_type: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sender_id: string
          shared_from_thread_id: string | null
          updated_at: string | null
        }
        Insert: {
          ai_flagged?: boolean | null
          attachments?: Json | null
          channel_id?: string | null
          content: string
          created_at?: string | null
          dm_conversation_id?: string | null
          flag_reason?: string | null
          flagged_by?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_flagged?: boolean | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          mentions?: string[] | null
          moderation_status?: string | null
          parent_message_id?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          post_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_id: string
          shared_from_thread_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_flagged?: boolean | null
          attachments?: Json | null
          channel_id?: string | null
          content?: string
          created_at?: string | null
          dm_conversation_id?: string | null
          flag_reason?: string | null
          flagged_by?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          is_flagged?: boolean | null
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          mentions?: string[] | null
          moderation_status?: string | null
          parent_message_id?: string | null
          pinned_at?: string | null
          pinned_by?: string | null
          post_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_id?: string
          shared_from_thread_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "community_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_messages_dm_conversation_id_fkey"
            columns: ["dm_conversation_id"]
            isOneToOne: false
            referencedRelation: "community_dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_messages_shared_from_thread_id_fkey"
            columns: ["shared_from_thread_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      community_user_channel_settings: {
        Row: {
          channel_id: string
          created_at: string | null
          id: string
          last_read_at: string | null
          notification_level: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          notification_level?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          notification_level?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_user_channel_settings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "community_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          completed: boolean | null
          course_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          lesson_title: string | null
          module_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          lesson_title?: string | null
          module_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          lesson_title?: string | null
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          catalog_visible_tier_ids: string[] | null
          course_order: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          upsell_funnel_url: string | null
          visible_tier_ids: string[] | null
          visible_tiers: string[] | null
        }
        Insert: {
          catalog_visible_tier_ids?: string[] | null
          course_order: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          upsell_funnel_url?: string | null
          visible_tier_ids?: string[] | null
          visible_tiers?: string[] | null
        }
        Update: {
          catalog_visible_tier_ids?: string[] | null
          course_order?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          upsell_funnel_url?: string | null
          visible_tier_ids?: string[] | null
          visible_tiers?: string[] | null
        }
        Relationships: []
      }
      csm_bulk_messages: {
        Row: {
          id: string
          message_content: string
          recipient_count: number | null
          sender_id: string
          sent_at: string | null
          status: string | null
          template_id: string | null
        }
        Insert: {
          id?: string
          message_content: string
          recipient_count?: number | null
          sender_id: string
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
        }
        Update: {
          id?: string
          message_content?: string
          recipient_count?: number | null
          sender_id?: string
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "csm_bulk_messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "csm_dm_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      csm_delegation_assignments: {
        Row: {
          delegation_id: string
          id: string
          student_id: string
        }
        Insert: {
          delegation_id: string
          id?: string
          student_id: string
        }
        Update: {
          delegation_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "csm_delegation_assignments_delegation_id_fkey"
            columns: ["delegation_id"]
            isOneToOne: false
            referencedRelation: "csm_delegations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csm_delegation_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_churn_risk_segments"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "csm_delegation_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      csm_delegations: {
        Row: {
          created_at: string
          delegate_csm_id: string
          end_date: string
          id: string
          original_csm_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delegate_csm_id: string
          end_date: string
          id?: string
          original_csm_id: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delegate_csm_id?: string
          end_date?: string
          id?: string
          original_csm_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "csm_delegations_delegate_csm_id_fkey"
            columns: ["delegate_csm_id"]
            isOneToOne: false
            referencedRelation: "user_churn_risk_segments"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "csm_delegations_delegate_csm_id_fkey"
            columns: ["delegate_csm_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csm_delegations_original_csm_id_fkey"
            columns: ["original_csm_id"]
            isOneToOne: false
            referencedRelation: "user_churn_risk_segments"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "csm_delegations_original_csm_id_fkey"
            columns: ["original_csm_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      csm_dm_templates: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          id: string
          is_active: boolean | null
          schedule_interval: string | null
          title: string
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          is_active?: boolean | null
          schedule_interval?: string | null
          title: string
          trigger_type?: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          schedule_interval?: string | null
          title?: string
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      csm_milestone_completions: {
        Row: {
          client_user_id: string
          completed_at: string
          completed_by: string
          id: string
          milestone_id: string
        }
        Insert: {
          client_user_id: string
          completed_at?: string
          completed_by: string
          id?: string
          milestone_id: string
        }
        Update: {
          client_user_id?: string
          completed_at?: string
          completed_by?: string
          id?: string
          milestone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "csm_milestone_completions_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "csm_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      csm_milestones: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      csm_outreach_status: {
        Row: {
          created_at: string
          id: string
          metric_type: string
          notes: string | null
          status: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metric_type: string
          notes?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metric_type?: string
          notes?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      discipline_task_form_fields: {
        Row: {
          created_at: string | null
          default_value: string | null
          field_type: string
          help_text: string | null
          id: string
          label: string
          name: string
          options: string[] | null
          order_index: number
          placeholder: string | null
          required: boolean | null
          task_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          field_type: string
          help_text?: string | null
          id?: string
          label: string
          name: string
          options?: string[] | null
          order_index: number
          placeholder?: string | null
          required?: boolean | null
          task_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          field_type?: string
          help_text?: string | null
          id?: string
          label?: string
          name?: string
          options?: string[] | null
          order_index?: number
          placeholder?: string | null
          required?: boolean | null
          task_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discipline_task_form_fields_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_task_sections: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          order_index: number
          section_type: string
          task_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          order_index: number
          section_type: string
          task_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          order_index?: number
          section_type?: string
          task_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discipline_task_sections_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      fathom_meeting_notes: {
        Row: {
          action_items: Json | null
          call_id: string | null
          created_at: string
          fathom_meeting_url: string | null
          fathom_recording_id: string
          id: string
          meeting_title: string | null
          recording_id: string | null
          summary: string | null
          transcript: Json | null
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          call_id?: string | null
          created_at?: string
          fathom_meeting_url?: string | null
          fathom_recording_id: string
          id?: string
          meeting_title?: string | null
          recording_id?: string | null
          summary?: string | null
          transcript?: Json | null
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          call_id?: string | null
          created_at?: string
          fathom_meeting_url?: string | null
          fathom_recording_id?: string
          id?: string
          meeting_title?: string | null
          recording_id?: string | null
          summary?: string | null
          transcript?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fathom_meeting_notes_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calendar_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fathom_meeting_notes_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "call_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_badges: {
        Row: {
          badge_key: string
          badge_name: string
          created_at: string | null
          description: string | null
          icon_name: string | null
          id: string
          points_value: number | null
          requirement_type: string | null
          requirement_value: number | null
          tier: string | null
        }
        Insert: {
          badge_key: string
          badge_name: string
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          points_value?: number | null
          requirement_type?: string | null
          requirement_value?: number | null
          tier?: string | null
        }
        Update: {
          badge_key?: string
          badge_name?: string
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          points_value?: number | null
          requirement_type?: string | null
          requirement_value?: number | null
          tier?: string | null
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          completion_date: string
          created_at: string | null
          id: string
          notes: string | null
          skipped: boolean | null
          updated_at: string | null
          user_habit_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          completion_date: string
          created_at?: string | null
          id?: string
          notes?: string | null
          skipped?: boolean | null
          updated_at?: string | null
          user_habit_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          completion_date?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          skipped?: boolean | null
          updated_at?: string | null
          user_habit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_user_habit_id_fkey"
            columns: ["user_habit_id"]
            isOneToOne: false
            referencedRelation: "user_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_streaks: {
        Row: {
          current_streak: number | null
          id: string
          last_completion_date: string | null
          longest_streak: number | null
          total_completions: number | null
          updated_at: string | null
          user_habit_id: string
          user_id: string
        }
        Insert: {
          current_streak?: number | null
          id?: string
          last_completion_date?: string | null
          longest_streak?: number | null
          total_completions?: number | null
          updated_at?: string | null
          user_habit_id: string
          user_id: string
        }
        Update: {
          current_streak?: number | null
          id?: string
          last_completion_date?: string | null
          longest_streak?: number | null
          total_completions?: number | null
          updated_at?: string | null
          user_habit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_streaks_user_habit_id_fkey"
            columns: ["user_habit_id"]
            isOneToOne: false
            referencedRelation: "user_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index: number
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      homework_assignments: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_exam: boolean | null
          points_value: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_exam?: boolean | null
          points_value?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_exam?: boolean | null
          points_value?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      impersonation_audit_log: {
        Row: {
          admin_email: string
          admin_user_id: string
          id: string
          impersonated_at: string
          target_email: string
          target_user_id: string
        }
        Insert: {
          admin_email: string
          admin_user_id: string
          id?: string
          impersonated_at?: string
          target_email: string
          target_user_id: string
        }
        Update: {
          admin_email?: string
          admin_user_id?: string
          id?: string
          impersonated_at?: string
          target_email?: string
          target_user_id?: string
        }
        Relationships: []
      }
      journey_milestones: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      leaderboard_cache: {
        Row: {
          id: string
          rank: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          rank?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          rank?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      missed_onboarding_events: {
        Row: {
          attendance_status: string
          created_at: string
          id: string
          rescheduled: boolean
          scheduled_call_time: string | null
          user_email: string
          user_id: string | null
          webhook_received_at: string
        }
        Insert: {
          attendance_status?: string
          created_at?: string
          id?: string
          rescheduled?: boolean
          scheduled_call_time?: string | null
          user_email: string
          user_id?: string | null
          webhook_received_at?: string
        }
        Update: {
          attendance_status?: string
          created_at?: string
          id?: string
          rescheduled?: boolean
          scheduled_call_time?: string | null
          user_email?: string
          user_id?: string | null
          webhook_received_at?: string
        }
        Relationships: []
      }
      phase_quiz_requirements: {
        Row: {
          created_at: string
          id: string
          is_required: boolean | null
          phase_id: string
          quiz_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean | null
          phase_id: string
          quiz_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean | null
          phase_id?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phase_quiz_requirements_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phase_quiz_requirements_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      phases: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          phase_order: number
          points: number | null
          required_phase_id: string | null
          requires_previous_completion: boolean | null
          title: string
          unlock_condition: Json | null
          unlock_delay_days: number | null
          unlock_type: string | null
          updated_at: string | null
          visible_tier_ids: string[] | null
          visible_tiers: string[] | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          phase_order: number
          points?: number | null
          required_phase_id?: string | null
          requires_previous_completion?: boolean | null
          title: string
          unlock_condition?: Json | null
          unlock_delay_days?: number | null
          unlock_type?: string | null
          updated_at?: string | null
          visible_tier_ids?: string[] | null
          visible_tiers?: string[] | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          phase_order?: number
          points?: number | null
          required_phase_id?: string | null
          requires_previous_completion?: boolean | null
          title?: string
          unlock_condition?: Json | null
          unlock_delay_days?: number | null
          unlock_type?: string | null
          updated_at?: string | null
          visible_tier_ids?: string[] | null
          visible_tiers?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "phases_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phases_required_phase_id_fkey"
            columns: ["required_phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_catalog: {
        Row: {
          archetypes: string[]
          created_at: string
          feature_mode: string
          handle: string
          id: string
          mission: string
          prompt_body: string | null
          title: string
          tooltip: string
          updated_at: string
        }
        Insert: {
          archetypes: string[]
          created_at?: string
          feature_mode?: string
          handle: string
          id?: string
          mission: string
          prompt_body?: string | null
          title: string
          tooltip: string
          updated_at?: string
        }
        Update: {
          archetypes?: string[]
          created_at?: string
          feature_mode?: string
          handle?: string
          id?: string
          mission?: string
          prompt_body?: string | null
          title?: string
          tooltip?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh_key: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh_key: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh_key?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          answer_options: Json
          correct_answer_id: string
          created_at: string
          explanation: string | null
          id: string
          question_order: number
          question_text: string
          quiz_id: string
          updated_at: string
        }
        Insert: {
          answer_options?: Json
          correct_answer_id: string
          created_at?: string
          explanation?: string | null
          id?: string
          question_order: number
          question_text: string
          quiz_id: string
          updated_at?: string
        }
        Update: {
          answer_options?: Json
          correct_answer_id?: string
          created_at?: string
          explanation?: string | null
          id?: string
          question_order?: number
          question_text?: string
          quiz_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_submissions: {
        Row: {
          answers: Json
          attempt_number: number
          id: string
          passed: boolean
          quiz_id: string
          score: number
          submitted_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          attempt_number?: number
          id?: string
          passed?: boolean
          quiz_id: string
          score?: number
          submitted_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          attempt_number?: number
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_submissions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          linked_phase_id: string
          passing_grade: number
          quiz_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          linked_phase_id: string
          passing_grade?: number
          quiz_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          linked_phase_id?: string
          passing_grade?: number
          quiz_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_linked_phase_id_fkey"
            columns: ["linked_phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          resource_type: string
          tags: string[] | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          resource_type: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          resource_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          page_visibility: Json | null
          role_key: string
          role_order: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          page_visibility?: Json | null
          role_key: string
          role_order: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          page_visibility?: Json | null
          role_key?: string
          role_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_messages: {
        Row: {
          attachments: Json | null
          channel_id: string | null
          content: string
          created_at: string | null
          dm_conversation_id: string | null
          id: string
          is_recurring: boolean | null
          last_sent_at: string | null
          mentions: string[] | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          scheduled_at: string
          sender_id: string
          status: string | null
          timezone: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          channel_id?: string | null
          content: string
          created_at?: string | null
          dm_conversation_id?: string | null
          id?: string
          is_recurring?: boolean | null
          last_sent_at?: string | null
          mentions?: string[] | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          scheduled_at: string
          sender_id: string
          status?: string | null
          timezone?: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          channel_id?: string | null
          content?: string
          created_at?: string | null
          dm_conversation_id?: string | null
          id?: string
          is_recurring?: boolean | null
          last_sent_at?: string | null
          mentions?: string[] | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          scheduled_at?: string
          sender_id?: string
          status?: string | null
          timezone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "community_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_messages_dm_conversation_id_fkey"
            columns: ["dm_conversation_id"]
            isOneToOne: false
            referencedRelation: "community_dm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_phases: {
        Row: {
          completion_banner_text: string | null
          created_at: string | null
          day_end: number
          day_start: number
          goal_text: string | null
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          completion_banner_text?: string | null
          created_at?: string | null
          day_end: number
          day_start: number
          goal_text?: string | null
          id?: string
          sort_order: number
          title: string
        }
        Update: {
          completion_banner_text?: string | null
          created_at?: string | null
          day_end?: number
          day_start?: number
          goal_text?: string | null
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      sprint_task_completions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          status: string | null
          task_day: number
          task_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          task_day: number
          task_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          status?: string | null
          task_day?: number
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "sprint_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_task_modules: {
        Row: {
          created_at: string | null
          id: string
          module_name: string
          sort_order: number
          task_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          module_name: string
          sort_order: number
          task_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          module_name?: string
          sort_order?: number
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_task_modules_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "sprint_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_task_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          sprint_task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          sprint_task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sprint_task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_task_notes_sprint_task_id_fkey"
            columns: ["sprint_task_id"]
            isOneToOne: false
            referencedRelation: "sprint_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      sprint_tasks: {
        Row: {
          common_mistakes: string | null
          created_at: string | null
          day_number: number
          id: string
          is_checkpoint: boolean | null
          is_final: boolean | null
          phase_id: string
          sort_order: number
          success_metrics: string | null
          templates: Json | null
          title: string
        }
        Insert: {
          common_mistakes?: string | null
          created_at?: string | null
          day_number: number
          id?: string
          is_checkpoint?: boolean | null
          is_final?: boolean | null
          phase_id: string
          sort_order: number
          success_metrics?: string | null
          templates?: Json | null
          title: string
        }
        Update: {
          common_mistakes?: string | null
          created_at?: string | null
          day_number?: number
          id?: string
          is_checkpoint?: boolean | null
          is_final?: boolean | null
          phase_id?: string
          sort_order?: number
          success_metrics?: string | null
          templates?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprint_tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "sprint_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      support_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          notification_type: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          attachments: Json | null
          created_at: string | null
          description: string
          has_new_reply: boolean | null
          id: string
          internal: boolean | null
          priority: string
          status: string
          subject: string
          submitter_email: string | null
          submitter_name: string | null
          submitter_tier_id: string | null
          submitter_user_id: string | null
          ticket_number: number
          ticket_type: string
          topic: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          description: string
          has_new_reply?: boolean | null
          id?: string
          internal?: boolean | null
          priority?: string
          status?: string
          subject: string
          submitter_email?: string | null
          submitter_name?: string | null
          submitter_tier_id?: string | null
          submitter_user_id?: string | null
          ticket_number?: number
          ticket_type?: string
          topic?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          description?: string
          has_new_reply?: boolean | null
          id?: string
          internal?: boolean | null
          priority?: string
          status?: string
          subject?: string
          submitter_email?: string | null
          submitter_name?: string | null
          submitter_tier_id?: string | null
          submitter_user_id?: string | null
          ticket_number?: number
          ticket_type?: string
          topic?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      task_responses: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          response: Json | null
          started_at: string | null
          status: string | null
          task_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          response?: Json | null
          started_at?: string | null
          status?: string | null
          task_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          response?: Json | null
          started_at?: string | null
          status?: string | null
          task_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_responses_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          content: Json | null
          content_url: string | null
          created_at: string | null
          description: string | null
          due_date_days: number | null
          due_date_enabled: boolean | null
          due_date_start_phase_id: string | null
          due_date_start_type: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          linked_module_id: string | null
          phase_id: string | null
          plan_group: string | null
          points: number | null
          show_in_course: boolean | null
          task_description: string | null
          task_order: number
          task_type: string | null
          tier: string | null
          title: string
          unlock_type: string | null
          updated_at: string | null
          visibility_condition_enabled: boolean | null
          visibility_condition_field_id: string | null
          visibility_condition_value: string | null
          visibility_conditions: Json | null
          visible_tier_ids: string[] | null
          visible_tiers: string[] | null
        }
        Insert: {
          content?: Json | null
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          due_date_days?: number | null
          due_date_enabled?: boolean | null
          due_date_start_phase_id?: string | null
          due_date_start_type?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          linked_module_id?: string | null
          phase_id?: string | null
          plan_group?: string | null
          points?: number | null
          show_in_course?: boolean | null
          task_description?: string | null
          task_order: number
          task_type?: string | null
          tier?: string | null
          title: string
          unlock_type?: string | null
          updated_at?: string | null
          visibility_condition_enabled?: boolean | null
          visibility_condition_field_id?: string | null
          visibility_condition_value?: string | null
          visibility_conditions?: Json | null
          visible_tier_ids?: string[] | null
          visible_tiers?: string[] | null
        }
        Update: {
          content?: Json | null
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          due_date_days?: number | null
          due_date_enabled?: boolean | null
          due_date_start_phase_id?: string | null
          due_date_start_type?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          linked_module_id?: string | null
          phase_id?: string | null
          plan_group?: string | null
          points?: number | null
          show_in_course?: boolean | null
          task_description?: string | null
          task_order?: number
          task_type?: string | null
          tier?: string | null
          title?: string
          unlock_type?: string | null
          updated_at?: string | null
          visibility_condition_enabled?: boolean | null
          visibility_condition_field_id?: string | null
          visibility_condition_value?: string | null
          visibility_conditions?: Json | null
          visible_tier_ids?: string[] | null
          visible_tiers?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_due_date_start_phase_id_fkey"
            columns: ["due_date_start_phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_linked_module_id_fkey"
            columns: ["linked_module_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_internal_notes: {
        Row: {
          attachments: Json | null
          author_email: string | null
          author_id: string | null
          author_name: string | null
          created_at: string | null
          id: string
          note: string
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          author_email?: string | null
          author_id?: string | null
          author_name?: string | null
          created_at?: string | null
          id?: string
          note: string
          ticket_id: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          author_email?: string | null
          author_id?: string | null
          author_name?: string | null
          created_at?: string | null
          id?: string
          note?: string
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_internal_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_metadata: {
        Row: {
          assigned_to_email: string | null
          assigned_to_name: string | null
          created_at: string | null
          escalated: boolean | null
          escalated_at: string | null
          escalated_reason: string | null
          id: string
          resolution_note: string | null
          sme_ticket_id: string | null
          status_override: string | null
          sync_attempted_at: string | null
          sync_error: string | null
          sync_retry_count: number
          sync_status: string
          tags: Json | null
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_to_email?: string | null
          assigned_to_name?: string | null
          created_at?: string | null
          escalated?: boolean | null
          escalated_at?: string | null
          escalated_reason?: string | null
          id?: string
          resolution_note?: string | null
          sme_ticket_id?: string | null
          status_override?: string | null
          sync_attempted_at?: string | null
          sync_error?: string | null
          sync_retry_count?: number
          sync_status?: string
          tags?: Json | null
          ticket_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_to_email?: string | null
          assigned_to_name?: string | null
          created_at?: string | null
          escalated?: boolean | null
          escalated_at?: string | null
          escalated_reason?: string | null
          id?: string
          resolution_note?: string | null
          sme_ticket_id?: string | null
          status_override?: string | null
          sync_attempted_at?: string | null
          sync_error?: string | null
          sync_retry_count?: number
          sync_status?: string
          tags?: Json | null
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_metadata_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_responses: {
        Row: {
          attachments: Json | null
          created_at: string | null
          id: string
          is_staff: boolean | null
          responder_email: string | null
          responder_name: string | null
          responder_user_id: string | null
          response_text: string
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          is_staff?: boolean | null
          responder_email?: string | null
          responder_name?: string | null
          responder_user_id?: string | null
          response_text: string
          ticket_id: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          is_staff?: boolean | null
          responder_email?: string | null
          responder_name?: string | null
          responder_user_id?: string | null
          response_text?: string
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tiers: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          feature_access: Json | null
          feature_visibility: Json | null
          id: string
          is_active: boolean | null
          page_visibility: Json | null
          tier_key: string
          tier_order: number
          updated_at: string | null
          upsell_funnel_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          feature_access?: Json | null
          feature_visibility?: Json | null
          id?: string
          is_active?: boolean | null
          page_visibility?: Json | null
          tier_key: string
          tier_order?: number
          updated_at?: string | null
          upsell_funnel_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          feature_access?: Json | null
          feature_visibility?: Json | null
          id?: string
          is_active?: boolean | null
          page_visibility?: Json | null
          tier_key?: string
          tier_order?: number
          updated_at?: string | null
          upsell_funnel_url?: string | null
        }
        Relationships: []
      }
      ugc_credit_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          credit_id: string | null
          description: string | null
          id: string
          performed_by: string | null
          transaction_type: string
          user_id: string
          video_generation_id: string | null
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          credit_id?: string | null
          description?: string | null
          id?: string
          performed_by?: string | null
          transaction_type: string
          user_id: string
          video_generation_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          credit_id?: string | null
          description?: string | null
          id?: string
          performed_by?: string | null
          transaction_type?: string
          user_id?: string
          video_generation_id?: string | null
        }
        Relationships: []
      }
      upsell_funnels: {
        Row: {
          created_at: string | null
          description: string | null
          funnel_url: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          funnel_url: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          funnel_url?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_achievement_badges: {
        Row: {
          awarded_at: string | null
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          badge_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievement_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "achievement_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_data: Json | null
          interaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_data?: Json | null
          interaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_data?: Json | null
          interaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          awarded_at: string | null
          badge_type: Database["public"]["Enums"]["badge_type"]
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          badge_type: Database["public"]["Enums"]["badge_type"]
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          badge_type?: Database["public"]["Enums"]["badge_type"]
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_course_access: {
        Row: {
          access_type: string | null
          course_id: string
          created_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          access_type?: string | null
          course_id: string
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          access_type?: string | null
          course_id?: string
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_access_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_habit_badges: {
        Row: {
          awarded_at: string | null
          badge_id: string
          id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string | null
          badge_id: string
          id?: string
          user_id: string
        }
        Update: {
          awarded_at?: string | null
          badge_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_habit_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "habit_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_habits: {
        Row: {
          created_at: string | null
          description: string | null
          habit_name: string
          icon_name: string | null
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          order_index: number
          template_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          habit_name: string
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          order_index?: number
          template_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          habit_name?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          order_index?: number
          template_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_habits_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "habit_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_homework_progress: {
        Row: {
          created_at: string | null
          feedback: string | null
          graded_at: string | null
          homework_id: string
          id: string
          score: number | null
          status: string | null
          submission_text: string | null
          submission_url: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          graded_at?: string | null
          homework_id: string
          id?: string
          score?: number | null
          status?: string | null
          submission_text?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          graded_at?: string | null
          homework_id?: string
          id?: string
          score?: number | null
          status?: string | null
          submission_text?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_homework_progress_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_journey_milestones: {
        Row: {
          completed_at: string
          id: string
          milestone_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          milestone_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          milestone_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_journey_milestones_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "journey_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_login_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_login_date: string | null
          longest_streak: number | null
          total_logins: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_login_date?: string | null
          longest_streak?: number | null
          total_logins?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_login_date?: string | null
          longest_streak?: number | null
          total_logins?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_main_feed_channels: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_main_feed_channels_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "community_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_milestones: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          milestone_type: Database["public"]["Enums"]["milestone_type"]
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          milestone_type: Database["public"]["Enums"]["milestone_type"]
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          milestone_type?: Database["public"]["Enums"]["milestone_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          data: Json | null
          id: string
          step_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          step_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          step_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          activity_description: string | null
          activity_type: string
          created_at: string | null
          id: string
          points: number
          user_id: string
        }
        Insert: {
          activity_description?: string | null
          activity_type: string
          created_at?: string | null
          id?: string
          points?: number
          user_id: string
        }
        Update: {
          activity_description?: string | null
          activity_type?: string
          created_at?: string | null
          id?: string
          points?: number
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          admin_notes: string | null
          assigned_csm_id: string | null
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          guarantee_status: string | null
          id: string
          is_active: boolean | null
          last_active_at: string | null
          last_name: string | null
          offboarding_date: string | null
          onboarding_booking_status: string | null
          onboarding_call_recording: string | null
          onboarding_call_summary: string | null
          onboarding_completed: boolean
          onboarding_date: string | null
          onboarding_sheet_url: string | null
          phone: string | null
          revenue: number | null
          role_id: string | null
          tier_id: string | null
          updated_at: string | null
          user_email: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_csm_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          guarantee_status?: string | null
          id: string
          is_active?: boolean | null
          last_active_at?: string | null
          last_name?: string | null
          offboarding_date?: string | null
          onboarding_booking_status?: string | null
          onboarding_call_recording?: string | null
          onboarding_call_summary?: string | null
          onboarding_completed?: boolean
          onboarding_date?: string | null
          onboarding_sheet_url?: string | null
          phone?: string | null
          revenue?: number | null
          role_id?: string | null
          tier_id?: string | null
          updated_at?: string | null
          user_email?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_csm_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          guarantee_status?: string | null
          id?: string
          is_active?: boolean | null
          last_active_at?: string | null
          last_name?: string | null
          offboarding_date?: string | null
          onboarding_booking_status?: string | null
          onboarding_call_recording?: string | null
          onboarding_call_summary?: string | null
          onboarding_completed?: boolean
          onboarding_date?: string | null
          onboarding_sheet_url?: string | null
          phone?: string | null
          revenue?: number | null
          role_id?: string | null
          tier_id?: string | null
          updated_at?: string | null
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_public_profiles: {
        Row: {
          avatar_url: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          role_id: string | null
          updated_at: string | null
          user_email: string | null
        }
        Insert: {
          avatar_url?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          role_id?: string | null
          updated_at?: string | null
          user_email?: string | null
        }
        Update: {
          avatar_url?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          role_id?: string | null
          updated_at?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      user_review_assignments: {
        Row: {
          active: boolean | null
          coach_id: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          coach_id: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          coach_id?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
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
      user_task_submissions: {
        Row: {
          created_at: string | null
          feedback: string | null
          file_url: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submission_data: Json | null
          task_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submission_data?: Json | null
          task_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submission_data?: Json | null
          task_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_checkins: {
        Row: {
          biggest_challenge: string | null
          biggest_win: string | null
          confidence_level: number | null
          created_at: string
          emotional_state: string | null
          goals_next_week: string | null
          id: string
          notes: string | null
          updated_at: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          biggest_challenge?: string | null
          biggest_win?: string | null
          confidence_level?: number | null
          created_at?: string
          emotional_state?: string | null
          goals_next_week?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          biggest_challenge?: string | null
          biggest_win?: string | null
          confidence_level?: number | null
          created_at?: string
          emotional_state?: string | null
          goals_next_week?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          ai_feedback: string | null
          ai_summary: string | null
          avg_loser: number | null
          avg_winner: number | null
          best_trade: number | null
          created_at: string
          emotional_summary: Json | null
          id: string
          losing_trades: number | null
          most_traded_model: string | null
          report_data: Json | null
          total_pnl: number | null
          total_trades: number | null
          updated_at: string
          user_id: string
          week_end_date: string
          week_start_date: string
          win_rate: number | null
          winning_trades: number | null
          worst_trade: number | null
        }
        Insert: {
          ai_feedback?: string | null
          ai_summary?: string | null
          avg_loser?: number | null
          avg_winner?: number | null
          best_trade?: number | null
          created_at?: string
          emotional_summary?: Json | null
          id?: string
          losing_trades?: number | null
          most_traded_model?: string | null
          report_data?: Json | null
          total_pnl?: number | null
          total_trades?: number | null
          updated_at?: string
          user_id: string
          week_end_date: string
          week_start_date: string
          win_rate?: number | null
          winning_trades?: number | null
          worst_trade?: number | null
        }
        Update: {
          ai_feedback?: string | null
          ai_summary?: string | null
          avg_loser?: number | null
          avg_winner?: number | null
          best_trade?: number | null
          created_at?: string
          emotional_summary?: Json | null
          id?: string
          losing_trades?: number | null
          most_traded_model?: string | null
          report_data?: Json | null
          total_pnl?: number | null
          total_trades?: number | null
          updated_at?: string
          user_id?: string
          week_end_date?: string
          week_start_date?: string
          win_rate?: number | null
          winning_trades?: number | null
          worst_trade?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      user_churn_risk_segments: {
        Row: {
          ab_group: string | null
          brand_leads_approved: number | null
          brand_leads_total: number | null
          churn_segment: string | null
          community_posts: number | null
          community_reactions: number | null
          days_active: number | null
          days_since_login: number | null
          display_name: string | null
          email: string | null
          is_activated: boolean | null
          onboarding_completed: boolean | null
          outreach_priority: number | null
          phone: string | null
          raw_score: number | null
          score_brand_leads: number | null
          score_community: number | null
          score_delta_7d: number | null
          score_onboarding: number | null
          score_recency: number | null
          score_sprints: number | null
          score_tasks: number | null
          score_tier: number | null
          signup_date: string | null
          sprints_completed: number | null
          tasks_completed: number | null
          tier_key: string | null
          total_score: number | null
          trend_flag: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_csm_delegation: {
        Args: { p_delegation_id: string }
        Returns: undefined
      }
      assign_csm_to_user: {
        Args: { p_csm_id?: string; p_user_id: string }
        Returns: undefined
      }
      assign_daily_habits: {
        Args: { p_target_date?: string; p_user_id: string }
        Returns: number
      }
      atp_ab_test_results: {
        Args: never
        Returns: {
          ab_group: string
          activated_users: number
          avg_days_to_reply: number
          avg_outreach_priority: number
          control_skips: number
          re_engaged_users: number
          re_engagement_rate: number
          response_rate: number
          total_outreach: number
          total_users: number
          users_who_replied: number
        }[]
      }
      atp_take_churn_segment_snapshot: { Args: never; Returns: Json }
      award_points_for_task: {
        Args: {
          p_activity_type?: string
          p_description: string
          p_points: number
          p_task_id: string
        }
        Returns: string
      }
      calculate_all_unread_counts: {
        Args: never
        Returns: {
          channel_id: string
          dm_conversation_id: string
          unread_count: number
        }[]
      }
      check_and_award_achievement_badges: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      check_and_award_badges: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      check_email_exists: { Args: { lookup_email: string }; Returns: boolean }
      check_phase_base_conditions: {
        Args: { _phase_id: string; _user_id: string }
        Returns: boolean
      }
      get_admin_only_user_ids: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      get_csm_user_ids: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      get_dm_conversations: {
        Args: never
        Returns: {
          conversation_id: string
          conversation_name: string
          created_at: string
          last_message_at: string
          last_message_content: string
          last_message_created_at: string
          last_message_sender_id: string
          other_participants: Json
          unread_count: number
          updated_at: string
        }[]
      }
      get_habit_analytics: {
        Args: { p_days_back?: number; p_user_id: string }
        Returns: {
          completed_count: number
          completion_date: string
          completion_rate: number
          total_habits: number
        }[]
      }
      get_my_assigned_csm_id: { Args: never; Returns: string }
      get_staff_user_ids: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      get_tier_leaderboard: {
        Args: { p_tier_id: string }
        Returns: {
          first_name: string
          last_name: string
          rank: number
          total_points: number
          user_email: string
          user_id: string
        }[]
      }
      get_today_habits: {
        Args: { p_user_id: string }
        Returns: {
          completed: boolean
          current_streak: number
          habit_name: string
          icon_name: string
          id: string
          notes: string
          skipped: boolean
          user_habit_id: string
        }[]
      }
      get_user_habit_stats: { Args: { p_user_id: string }; Returns: Json }
      get_users_with_progress: {
        Args: {
          p_course_ids?: string[]
          p_csm_filter?: string
          p_guarantee_filter?: string
          p_invitation_filter?: string
          p_onboarding_filter?: string
          p_page?: number
          p_per_page?: number
          p_role_id?: string
          p_search?: string
          p_sort_column?: string
          p_sort_direction?: string
          p_tier_ids?: string[]
        }
        Returns: {
          assigned_csm_id: string
          completed_tasks: number
          created_at: string
          email: string
          first_name: string
          guarantee_status: string
          id: string
          is_active: boolean
          last_name: string
          last_sign_in_at: string
          offboarding_date: string
          onboarding_booking_status: string
          onboarding_completed: boolean
          onboarding_date: string
          phone: string
          progress_percentage: number
          revenue: number
          role: string
          role_id: string
          tier: string
          tier_id: string
          total_count: number
          total_tasks: number
        }[]
      }
      has_course_access: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      has_feature_access: {
        Args: { _feature_key: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_key: {
        Args: { _role_key: string; _user_id: string }
        Returns: boolean
      }
      increment_sync_retry_count: {
        Args: { row_ticket_id: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_csm_only: { Args: { _user_id: string }; Returns: boolean }
      is_dm_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_phase_quiz_completed: {
        Args: { _phase_id: string; _user_id: string }
        Returns: boolean
      }
      is_phase_unlocked: {
        Args: { _phase_id: string; _user_id: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      is_task_unlocked: {
        Args: { _task_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_blocked_from_chat: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      refresh_leaderboard_cache: { Args: never; Returns: undefined }
      revert_csm_delegation: {
        Args: { p_delegation_id: string }
        Returns: undefined
      }
      seed_user_habits: { Args: { p_user_id: string }; Returns: undefined }
      toggle_habit_completion: {
        Args: {
          p_completion_date?: string
          p_user_habit_id: string
          p_user_id: string
        }
        Returns: Json
      }
      toggle_habit_skip: {
        Args: {
          p_completion_date?: string
          p_user_habit_id: string
          p_user_id: string
        }
        Returns: Json
      }
      update_habit_streak: {
        Args: { p_user_habit_id: string; p_user_id: string }
        Returns: undefined
      }
      update_login_streak: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "mega_admin"
        | "operations"
        | "client_stb"
        | "client_elite"
        | "client_ultimate"
        | "csm"
        | "executive"
      badge_category:
        | "onboarding"
        | "learning"
        | "trading_performance"
        | "consistency"
        | "community"
        | "special"
      badge_type:
        | "onboarding_complete"
        | "first_homework"
        | "first_trade"
        | "streak_7"
        | "streak_30"
        | "perfect_week"
      milestone_type:
        | "onboarding_complete"
        | "first_live_call"
        | "first_homework"
        | "first_trade"
        | "first_green_day"
        | "first_week_complete"
        | "first_quiz_passed"
      task_status: "pending" | "in_progress" | "completed" | "skipped"
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
      app_role: [
        "admin",
        "user",
        "mega_admin",
        "operations",
        "client_stb",
        "client_elite",
        "client_ultimate",
        "csm",
        "executive",
      ],
      badge_category: [
        "onboarding",
        "learning",
        "trading_performance",
        "consistency",
        "community",
        "special",
      ],
      badge_type: [
        "onboarding_complete",
        "first_homework",
        "first_trade",
        "streak_7",
        "streak_30",
        "perfect_week",
      ],
      milestone_type: [
        "onboarding_complete",
        "first_live_call",
        "first_homework",
        "first_trade",
        "first_green_day",
        "first_week_complete",
        "first_quiz_passed",
      ],
      task_status: ["pending", "in_progress", "completed", "skipped"],
    },
  },
} as const
