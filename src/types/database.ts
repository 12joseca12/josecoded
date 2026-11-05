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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          author_id: string | null
          body: string | null
          contact_id: string
          created_at: string
          deal_id: string | null
          id: string
          kind: Database["public"]["Enums"]["activity_kind"]
          occurred_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          contact_id: string
          created_at?: string
          deal_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["activity_kind"]
          occurred_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string | null
          contact_id?: string
          created_at?: string
          deal_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["activity_kind"]
          occurred_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_belongs_to_contact"
            columns: ["deal_id", "contact_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id", "contact_id"]
          },
        ]
      }
      contacts: {
        Row: {
          archived_at: string | null
          city: string | null
          created_at: string
          created_by_admin: boolean
          email: string | null
          full_name: string
          id: string
          import_id: string | null
          kind: Database["public"]["Enums"]["contact_kind"]
          last_activity_at: string | null
          lead_id: string | null
          linkedin_url: string | null
          next_action: string | null
          next_action_at: string | null
          notes: string | null
          organization: string | null
          owner_id: string | null
          phone: string | null
          radar_finding_id: string | null
          role_title: string | null
          source: Database["public"]["Enums"]["contact_source"]
          tags: string[]
          updated_at: string
          website: string | null
        }
        Insert: {
          archived_at?: string | null
          city?: string | null
          created_at?: string
          created_by_admin?: boolean
          email?: string | null
          full_name: string
          id?: string
          import_id?: string | null
          kind?: Database["public"]["Enums"]["contact_kind"]
          last_activity_at?: string | null
          lead_id?: string | null
          linkedin_url?: string | null
          next_action?: string | null
          next_action_at?: string | null
          notes?: string | null
          organization?: string | null
          owner_id?: string | null
          phone?: string | null
          radar_finding_id?: string | null
          role_title?: string | null
          source?: Database["public"]["Enums"]["contact_source"]
          tags?: string[]
          updated_at?: string
          website?: string | null
        }
        Update: {
          archived_at?: string | null
          city?: string | null
          created_at?: string
          created_by_admin?: boolean
          email?: string | null
          full_name?: string
          id?: string
          import_id?: string | null
          kind?: Database["public"]["Enums"]["contact_kind"]
          last_activity_at?: string | null
          lead_id?: string | null
          linkedin_url?: string | null
          next_action?: string | null
          next_action_at?: string | null
          notes?: string | null
          organization?: string | null
          owner_id?: string | null
          phone?: string | null
          radar_finding_id?: string | null
          role_title?: string | null
          source?: Database["public"]["Enums"]["contact_source"]
          tags?: string[]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          added_by: string | null
          can_write: boolean
          conversation_id: string
          joined_at: string
          last_read_at: string | null
          left_at: string | null
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          added_by?: string | null
          can_write?: boolean
          conversation_id: string
          joined_at?: string
          last_read_at?: string | null
          left_at?: string | null
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          added_by?: string | null
          can_write?: boolean
          conversation_id?: string
          joined_at?: string
          last_read_at?: string | null
          left_at?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          ai_consent_at: string | null
          ai_consent_by: string | null
          ai_consent_revoked_at: string | null
          ai_enabled: boolean
          ai_off_reason: string | null
          archived_at: string | null
          contact_id: string | null
          created_at: string
          first_page_path: string | null
          id: string
          interest: boolean | null
          kind: Database["public"]["Enums"]["conversation_kind"]
          last_activity_at: string
          lead_id: string | null
          locale: Database["public"]["Enums"]["app_locale"]
          project_id: string | null
          status: Database["public"]["Enums"]["conversation_status"]
          subject_user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          ai_consent_at?: string | null
          ai_consent_by?: string | null
          ai_consent_revoked_at?: string | null
          ai_enabled?: boolean
          ai_off_reason?: string | null
          archived_at?: string | null
          contact_id?: string | null
          created_at?: string
          first_page_path?: string | null
          id?: string
          interest?: boolean | null
          kind: Database["public"]["Enums"]["conversation_kind"]
          last_activity_at?: string
          lead_id?: string | null
          locale?: Database["public"]["Enums"]["app_locale"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          subject_user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          ai_consent_at?: string | null
          ai_consent_by?: string | null
          ai_consent_revoked_at?: string | null
          ai_enabled?: boolean
          ai_off_reason?: string | null
          archived_at?: string | null
          contact_id?: string | null
          created_at?: string
          first_page_path?: string | null
          id?: string
          interest?: boolean | null
          kind?: Database["public"]["Enums"]["conversation_kind"]
          last_activity_at?: string
          lead_id?: string | null
          locale?: Database["public"]["Enums"]["app_locale"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"]
          subject_user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_ai_consent_by_fkey"
            columns: ["ai_consent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_ai_consent_by_fkey"
            columns: ["ai_consent_by"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          amount: number | null
          contact_id: string
          created_at: string
          currency: string
          id: string
          lost_at: string | null
          lost_reason: string | null
          owner_id: string | null
          pack_id: string | null
          stage: Database["public"]["Enums"]["deal_stage"]
          updated_at: string
          via: Database["public"]["Enums"]["contact_via"]
          won_amount: number | null
          won_at: string | null
        }
        Insert: {
          amount?: number | null
          contact_id: string
          created_at?: string
          currency?: string
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          owner_id?: string | null
          pack_id?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string
          via: Database["public"]["Enums"]["contact_via"]
          won_amount?: number | null
          won_at?: string | null
        }
        Update: {
          amount?: number | null
          contact_id?: string
          created_at?: string
          currency?: string
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          owner_id?: string | null
          pack_id?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string
          via?: Database["public"]["Enums"]["contact_via"]
          won_amount?: number | null
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      extras: {
        Row: {
          archived_at: string | null
          billing: Database["public"]["Enums"]["extra_billing"]
          created_at: string
          name_en: string
          name_es: string
          price: number | null
          slug: string
          sort: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          archived_at?: string | null
          billing?: Database["public"]["Enums"]["extra_billing"]
          created_at?: string
          name_en: string
          name_es: string
          price?: number | null
          slug: string
          sort?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          archived_at?: string | null
          billing?: Database["public"]["Enums"]["extra_billing"]
          created_at?: string
          name_en?: string
          name_es?: string
          price?: number | null
          slug?: string
          sort?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          auth_user_id: string | null
          closer_rate: number | null
          closer_recurring_rate: number | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          note: string | null
          parent_closer_id: string | null
          parent_rate: number | null
          parent_recurring_rate: number | null
          payout_cadence: Database["public"]["Enums"]["payout_cadence"] | null
          project_id: string | null
          revoked_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          auth_user_id?: string | null
          closer_rate?: number | null
          closer_recurring_rate?: number | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          note?: string | null
          parent_closer_id?: string | null
          parent_rate?: number | null
          parent_recurring_rate?: number | null
          payout_cadence?: Database["public"]["Enums"]["payout_cadence"] | null
          project_id?: string | null
          revoked_at?: string | null
          role: Database["public"]["Enums"]["user_role"]
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          auth_user_id?: string | null
          closer_rate?: number | null
          closer_recurring_rate?: number | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          note?: string | null
          parent_closer_id?: string | null
          parent_rate?: number | null
          parent_recurring_rate?: number | null
          payout_cadence?: Database["public"]["Enums"]["payout_cadence"] | null
          project_id?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_parent_closer_id_fkey"
            columns: ["parent_closer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_parent_closer_id_fkey"
            columns: ["parent_closer_id"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          company: string | null
          consent_at: string | null
          contact_id: string | null
          conversation_id: string | null
          created_at: string
          deal_id: string | null
          discard_reason: string | null
          discarded_by: string | null
          email: string | null
          extras: string[]
          full_name: string
          handled_at: string | null
          has_domain: boolean | null
          has_store_accounts: boolean | null
          id: string
          locale: Database["public"]["Enums"]["app_locale"] | null
          message: string | null
          offer: string | null
          offer_answers: Json | null
          offer_url: string | null
          organization: string | null
          pack_id: string | null
          page_path: string | null
          phone: string | null
          radar_finding_id: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          via: Database["public"]["Enums"]["contact_via"] | null
          wanted_by: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          company?: string | null
          consent_at?: string | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string
          deal_id?: string | null
          discard_reason?: string | null
          discarded_by?: string | null
          email?: string | null
          extras?: string[]
          full_name: string
          handled_at?: string | null
          has_domain?: boolean | null
          has_store_accounts?: boolean | null
          id?: string
          locale?: Database["public"]["Enums"]["app_locale"] | null
          message?: string | null
          offer?: string | null
          offer_answers?: Json | null
          offer_url?: string | null
          organization?: string | null
          pack_id?: string | null
          page_path?: string | null
          phone?: string | null
          radar_finding_id?: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          via?: Database["public"]["Enums"]["contact_via"] | null
          wanted_by?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          company?: string | null
          consent_at?: string | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string
          deal_id?: string | null
          discard_reason?: string | null
          discarded_by?: string | null
          email?: string | null
          extras?: string[]
          full_name?: string
          handled_at?: string | null
          has_domain?: boolean | null
          has_store_accounts?: boolean | null
          id?: string
          locale?: Database["public"]["Enums"]["app_locale"] | null
          message?: string | null
          offer?: string | null
          offer_answers?: Json | null
          offer_url?: string | null
          organization?: string | null
          pack_id?: string | null
          page_path?: string | null
          phone?: string | null
          radar_finding_id?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          via?: Database["public"]["Enums"]["contact_via"] | null
          wanted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_discarded_by_fkey"
            columns: ["discarded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_discarded_by_fkey"
            columns: ["discarded_by"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_plans: {
        Row: {
          archived_at: string | null
          created_at: string
          includes_en: string[]
          includes_es: string[]
          name_en: string
          name_es: string
          price_monthly: number | null
          slug: string
          sort: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          includes_en?: string[]
          includes_es?: string[]
          name_en: string
          name_es: string
          price_monthly?: number | null
          slug: string
          sort?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          includes_en?: string[]
          includes_es?: string[]
          name_en?: string
          name_es?: string
          price_monthly?: number | null
          slug?: string
          sort?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      messages: {
        Row: {
          auto: boolean
          author_id: string | null
          author_kind: Database["public"]["Enums"]["author_kind"]
          body: string
          conversation_id: string
          created_at: string
          id: string
          job_id: string | null
          kind: Database["public"]["Enums"]["message_kind"]
          mentions_nexo: boolean
          model: string | null
          page_path: string | null
          ref_contact_id: string | null
          ref_story_id: string | null
          ref_task_id: string | null
          sources: string[]
          system_event: Database["public"]["Enums"]["system_event"] | null
        }
        Insert: {
          auto?: boolean
          author_id?: string | null
          author_kind: Database["public"]["Enums"]["author_kind"]
          body?: string
          conversation_id: string
          created_at?: string
          id?: string
          job_id?: string | null
          kind?: Database["public"]["Enums"]["message_kind"]
          mentions_nexo?: boolean
          model?: string | null
          page_path?: string | null
          ref_contact_id?: string | null
          ref_story_id?: string | null
          ref_task_id?: string | null
          sources?: string[]
          system_event?: Database["public"]["Enums"]["system_event"] | null
        }
        Update: {
          auto?: boolean
          author_id?: string | null
          author_kind?: Database["public"]["Enums"]["author_kind"]
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          job_id?: string | null
          kind?: Database["public"]["Enums"]["message_kind"]
          mentions_nexo?: boolean
          model?: string | null
          page_path?: string | null
          ref_contact_id?: string | null
          ref_story_id?: string | null
          ref_task_id?: string | null
          sources?: string[]
          system_event?: Database["public"]["Enums"]["system_event"] | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_ref_contact_id_fkey"
            columns: ["ref_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_prefs: {
        Row: {
          bell: boolean
          email: boolean
          event: Database["public"]["Enums"]["notification_event"]
          telegram: boolean
          user_id: string
        }
        Insert: {
          bell?: boolean
          email?: boolean
          event: Database["public"]["Enums"]["notification_event"]
          telegram?: boolean
          user_id: string
        }
        Update: {
          bell?: boolean
          email?: boolean
          event?: Database["public"]["Enums"]["notification_event"]
          telegram?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_prefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_prefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          event: Database["public"]["Enums"]["notification_event"]
          href: string | null
          id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          event: Database["public"]["Enums"]["notification_event"]
          href?: string | null
          id?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          event?: Database["public"]["Enums"]["notification_event"]
          href?: string | null
          id?: string
          read_at?: string | null
          title?: string
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
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          archived_at: string | null
          created_at: string
          includes_en: string[]
          includes_es: string[]
          name_en: string
          name_es: string
          platform: Database["public"]["Enums"]["catalog_platform"]
          price: number | null
          slug: string
          sort: number
          updated_at: string
          visible: boolean
          weeks_max: number
          weeks_min: number
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          includes_en?: string[]
          includes_es?: string[]
          name_en: string
          name_es: string
          platform: Database["public"]["Enums"]["catalog_platform"]
          price?: number | null
          slug: string
          sort?: number
          updated_at?: string
          visible?: boolean
          weeks_max: number
          weeks_min: number
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          includes_en?: string[]
          includes_es?: string[]
          name_en?: string
          name_es?: string
          platform?: Database["public"]["Enums"]["catalog_platform"]
          price?: number | null
          slug?: string
          sort?: number
          updated_at?: string
          visible?: boolean
          weeks_max?: number
          weeks_min?: number
        }
        Relationships: []
      }
      price_changes: {
        Row: {
          after: string | null
          before: string | null
          changed_at: string
          changed_by: string | null
          field: string
          id: number
          row_id: string
          table_name: string
        }
        Insert: {
          after?: string | null
          before?: string | null
          changed_at?: string
          changed_by?: string | null
          field: string
          id?: number
          row_id: string
          table_name: string
        }
        Update: {
          after?: string | null
          before?: string | null
          changed_at?: string
          changed_by?: string | null
          field?: string
          id?: number
          row_id?: string
          table_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          archived_at: string | null
          closer_rate: number | null
          closer_recurring_rate: number | null
          created_at: string
          full_name: string
          id: string
          invited_by: string | null
          is_active: boolean
          locale: Database["public"]["Enums"]["app_locale"]
          parent_closer_id: string | null
          parent_rate: number | null
          parent_recurring_rate: number | null
          payout_cadence: Database["public"]["Enums"]["payout_cadence"] | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          closer_rate?: number | null
          closer_recurring_rate?: number | null
          created_at?: string
          full_name: string
          id: string
          invited_by?: string | null
          is_active?: boolean
          locale?: Database["public"]["Enums"]["app_locale"]
          parent_closer_id?: string | null
          parent_rate?: number | null
          parent_recurring_rate?: number | null
          payout_cadence?: Database["public"]["Enums"]["payout_cadence"] | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          closer_rate?: number | null
          closer_recurring_rate?: number | null
          created_at?: string
          full_name?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          locale?: Database["public"]["Enums"]["app_locale"]
          parent_closer_id?: string | null
          parent_rate?: number | null
          parent_recurring_rate?: number | null
          payout_cadence?: Database["public"]["Enums"]["payout_cadence"] | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_parent_closer_id_fkey"
            columns: ["parent_closer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_parent_closer_id_fkey"
            columns: ["parent_closer_id"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rates: {
        Row: {
          code: string
          created_at: string
          label_en: string
          label_es: string
          price: number | null
          sort: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          code: string
          created_at?: string
          label_en: string
          label_es: string
          price?: number | null
          sort?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          label_en?: string
          label_es?: string
          price?: number | null
          sort?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          public: boolean | null
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          public?: never
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          public?: never
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          consent_at: string | null
          created_at: string
          id: string
          last_activity_at: string
          lead_id: string | null
          locale: Database["public"]["Enums"]["app_locale"]
          token_hash: string
        }
        Insert: {
          consent_at?: string | null
          created_at?: string
          id?: string
          last_activity_at?: string
          lead_id?: string | null
          locale?: Database["public"]["Enums"]["app_locale"]
          token_hash: string
        }
        Update: {
          consent_at?: string | null
          created_at?: string
          id?: string
          last_activity_at?: string
          lead_id?: string | null
          locale?: Database["public"]["Enums"]["app_locale"]
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitors_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      my_conversations: {
        Row: {
          ai_active: boolean | null
          ai_enabled: boolean | null
          consent_state: string | null
          counterpart_name: string | null
          first_page_path: string | null
          id: string | null
          kind: Database["public"]["Enums"]["conversation_kind"] | null
          last_activity_at: string | null
          last_message_excerpt: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["conversation_status"] | null
          unread_count: number | null
        }
        Insert: {
          ai_active?: boolean | null
          ai_enabled?: boolean | null
          consent_state?: string | null
          counterpart_name?: string | null
          first_page_path?: string | null
          id?: string | null
          kind?: Database["public"]["Enums"]["conversation_kind"] | null
          last_activity_at?: string | null
          last_message_excerpt?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          unread_count?: number | null
        }
        Update: {
          ai_active?: boolean | null
          ai_enabled?: boolean | null
          consent_state?: string | null
          counterpart_name?: string | null
          first_page_path?: string | null
          id?: string | null
          kind?: Database["public"]["Enums"]["conversation_kind"] | null
          last_activity_at?: string | null
          last_message_excerpt?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["conversation_status"] | null
          unread_count?: number | null
        }
        Relationships: []
      }
      public_extras: {
        Row: {
          billing: Database["public"]["Enums"]["extra_billing"] | null
          name_en: string | null
          name_es: string | null
          price: number | null
          slug: string | null
          sort: number | null
        }
        Insert: {
          billing?: Database["public"]["Enums"]["extra_billing"] | null
          name_en?: string | null
          name_es?: string | null
          price?: number | null
          slug?: string | null
          sort?: number | null
        }
        Update: {
          billing?: Database["public"]["Enums"]["extra_billing"] | null
          name_en?: string | null
          name_es?: string | null
          price?: number | null
          slug?: string | null
          sort?: number | null
        }
        Relationships: []
      }
      public_maintenance_plans: {
        Row: {
          includes_en: string[] | null
          includes_es: string[] | null
          name_en: string | null
          name_es: string | null
          price_monthly: number | null
          slug: string | null
          sort: number | null
        }
        Insert: {
          includes_en?: string[] | null
          includes_es?: string[] | null
          name_en?: string | null
          name_es?: string | null
          price_monthly?: number | null
          slug?: string | null
          sort?: number | null
        }
        Update: {
          includes_en?: string[] | null
          includes_es?: string[] | null
          name_en?: string | null
          name_es?: string | null
          price_monthly?: number | null
          slug?: string | null
          sort?: number | null
        }
        Relationships: []
      }
      public_offers: {
        Row: {
          includes_en: string[] | null
          includes_es: string[] | null
          name_en: string | null
          name_es: string | null
          platform: Database["public"]["Enums"]["catalog_platform"] | null
          price: number | null
          slug: string | null
          sort: number | null
          weeks_max: number | null
          weeks_min: number | null
        }
        Insert: {
          includes_en?: string[] | null
          includes_es?: string[] | null
          name_en?: string | null
          name_es?: string | null
          platform?: Database["public"]["Enums"]["catalog_platform"] | null
          price?: number | null
          slug?: string | null
          sort?: number | null
          weeks_max?: number | null
          weeks_min?: number | null
        }
        Update: {
          includes_en?: string[] | null
          includes_es?: string[] | null
          name_en?: string | null
          name_es?: string | null
          platform?: Database["public"]["Enums"]["catalog_platform"] | null
          price?: number | null
          slug?: string | null
          sort?: number | null
          weeks_max?: number | null
          weeks_min?: number | null
        }
        Relationships: []
      }
      public_rates: {
        Row: {
          code: string | null
          label_en: string | null
          label_es: string | null
          price: number | null
          sort: number | null
        }
        Insert: {
          code?: string | null
          label_en?: string | null
          label_es?: string | null
          price?: number | null
          sort?: number | null
        }
        Update: {
          code?: string | null
          label_en?: string | null
          label_es?: string | null
          price?: number | null
          sort?: number | null
        }
        Relationships: []
      }
      team_profiles: {
        Row: {
          full_name: string | null
          id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          full_name?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          full_name?: string | null
          id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invitation: {
        Args: { p_full_name: string; p_locale?: Database["public"]["Enums"]["app_locale"]; p_token: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      add_member: {
        Args: { p_can_write?: boolean; p_conversation_id: string; p_role: Database["public"]["Enums"]["member_role"]; p_user_id: string }
        Returns: undefined
      }
      admin_audit_log: {
        Args: { p_limit?: number; p_row_id?: string; p_table?: string }
        Returns: {
          action: string
          actor_id: string | null
          actor_name: string | null
          after: Json | null
          at: string
          before: Json | null
          id: number
          row_id: string | null
          table_name: string
        }[]
      }
      admin_counters: {
        Args: never
        Returns: Json
      }
      admin_jobs: {
        Args: {
          p_limit?: number
          p_status?: Database["public"]["Enums"]["job_status"]
        }
        Returns: {
          attempts: number
          created_at: string
          error: string
          finished_at: string
          id: string
          kind: Database["public"]["Enums"]["job_kind"]
          max_attempts: number
          run_after: string
          status: Database["public"]["Enums"]["job_status"]
        }[]
      }
      admin_users: {
        Args: never
        Returns: {
          accrued_pending: number
          archived_at: string | null
          closer_rate: number | null
          closer_recurring_rate: number | null
          contacts_count: number
          created_at: string
          email: string | null
          full_name: string
          has_totp: boolean
          id: string
          is_active: boolean
          open_deals: number
          parent_closer_id: string | null
          parent_rate: number | null
          parent_recurring_rate: number | null
          payout_cadence: Database["public"]["Enums"]["payout_cadence"] | null
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      archive_conversation: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      assign_lead: {
        Args: { p_lead_id: string; p_user_id: string }
        Returns: string
      }
      cancel_job: {
        Args: { p_id: string }
        Returns: Database["public"]["Enums"]["job_status"]
      }
      claim_lead: {
        Args: { p_lead_id: string }
        Returns: string
      }
      discard_lead: {
        Args: { p_lead_id: string; p_reason: string }
        Returns: undefined
      }
      ensure_my_conversation: {
        Args: never
        Returns: string
      }
      invite_user: {
        Args: { p_auth_user_id?: string; p_closer_rate?: number; p_closer_recurring_rate?: number; p_email: string; p_note?: string; p_parent_closer_id?: string; p_parent_rate?: number; p_parent_recurring_rate?: number; p_payout_cadence?: Database["public"]["Enums"]["payout_cadence"]; p_project_id?: string; p_role: Database["public"]["Enums"]["user_role"] }
        Returns: {
          invitation_id: string
          token: string
        }[]
      }
      list_lead_inbox: {
        Args: never
        Returns: {
          created_at: string
          excerpt: string
          extras: string[]
          first_name: string
          id: string
          locale: Database["public"]["Enums"]["app_locale"]
          offer: string
          via: Database["public"]["Enums"]["contact_via"]
        }[]
      }
      list_room_members: {
        Args: { p_conversation_id: string }
        Returns: {
          can_write: boolean
          full_name: string
          joined_at: string
          left_at: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }[]
      }
      log_totp_reset: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      mark_notifications_read: {
        Args: { p_ids: string[] }
        Returns: number
      }
      mark_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      omen_claim_jobs: {
        Args: { p_limit?: number; p_worker: string }
        Returns: {
          attempts: number
          id: string
          kind: Database["public"]["Enums"]["job_kind"]
          max_attempts: number
          payload: Json
        }[]
      }
      omen_finish_job: {
        Args: { p_error?: string; p_id: string; p_result?: Json }
        Returns: Database["public"]["Enums"]["job_status"]
      }
      omen_heartbeat: {
        Args: { p_models?: Json; p_version?: string }
        Returns: undefined
      }
      omen_status: {
        Args: never
        Returns: Json
      }
      outbox_claim: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          channel: Database["public"]["Enums"]["outbox_channel"]
          id: number
          payload: Json
          recipient: string
          template: string
        }[]
      }
      outbox_mark: {
        Args: { p_error?: string; p_id: number; p_ok: boolean }
        Returns: undefined
      }
      read_invitation: {
        Args: { p_token: string }
        Returns: {
          email: string
          expires_at: string
          invited_by_name: string
          role: Database["public"]["Enums"]["user_role"]
          status: string
        }[]
      }
      read_public_settings: {
        Args: never
        Returns: {
          key: string
          updated_at: string
          value: Json
        }[]
      }
      reassign_portfolio: {
        Args: { p_from_user: string; p_to_user: string }
        Returns: {
          contacts: number
          deals: number
          leads: number
        }[]
      }
      remove_member: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: undefined
      }
      renew_invitation: {
        Args: { p_id: string }
        Returns: {
          invitation_id: string
          token: string
        }[]
      }
      retry_job: {
        Args: { p_id: string }
        Returns: Database["public"]["Enums"]["job_status"]
      }
      revoke_invitation: {
        Args: { p_id: string }
        Returns: undefined
      }
      send_test_notification: {
        Args: { p_channel: string }
        Returns: undefined
      }
      set_ai_consent: {
        Args: { p_conversation_id: string; p_granted: boolean }
        Returns: undefined
      }
      set_conversation_ai: {
        Args: { p_conversation_id: string; p_enabled: boolean }
        Returns: undefined
      }
      set_notification_pref: {
        Args: { p_channel: string; p_enabled: boolean; p_event: Database["public"]["Enums"]["notification_event"] }
        Returns: undefined
      }
      set_setting: {
        Args: { p_key: string; p_value: Json }
        Returns: string
      }
      set_user_active: {
        Args: { p_active: boolean; p_user_id: string }
        Returns: undefined
      }
      set_user_rates: {
        Args: { p_closer_rate?: number; p_closer_recurring_rate?: number; p_parent_rate?: number; p_parent_recurring_rate?: number; p_payout_cadence?: Database["public"]["Enums"]["payout_cadence"]; p_user_id: string }
        Returns: undefined
      }
      submit_lead: {
        Args: {
          p_company?: string
          p_consent?: boolean
          p_email?: string
          p_extras?: string[]
          p_full_name?: string
          p_has_domain?: boolean
          p_has_store_accounts?: boolean
          p_ip_hash?: string
          p_locale?: Database["public"]["Enums"]["app_locale"]
          p_message?: string
          p_offer?: string
          p_offer_answers?: Json
          p_offer_url?: string
          p_organization?: string
          p_pack_id?: string
          p_page_path?: string
          p_phone?: string
          p_source: Database["public"]["Enums"]["lead_source"]
          p_via?: Database["public"]["Enums"]["contact_via"]
          p_wanted_by?: string
        }
        Returns: string
      }
      telegram_confirm_link: {
        Args: { p_chat_id: number; p_code: string }
        Returns: string
      }
      telegram_link_code: {
        Args: never
        Returns: string
      }
      telegram_link_status: {
        Args: never
        Returns: {
          linked_at: string | null
          pending_code: string | null
          pending_expires_at: string | null
        }[]
      }
      telegram_unlink: {
        Args: never
        Returns: undefined
      }
      touch_lead: {
        Args: { p_lead_id: string }
        Returns: undefined
      }
      update_my_profile: {
        Args: {
          p_full_name?: string
          p_locale?: Database["public"]["Enums"]["app_locale"]
        }
        Returns: undefined
      }
      visitor_forget: {
        Args: { p_lead_id?: string; p_token_hash?: string }
        Returns: number
      }
      visitor_handoff: {
        Args: { p_consent: boolean; p_email: string; p_name: string; p_phone: string; p_token_hash: string }
        Returns: string
      }
      visitor_send: {
        Args: { p_body: string; p_ip_hash: string; p_locale: Database["public"]["Enums"]["app_locale"]; p_page_path: string; p_token_hash: string }
        Returns: {
          conversation_id: string
          message_id: string
        }[]
      }
      visitor_thread: {
        Args: { p_since?: string; p_token_hash: string }
        Returns: Json
      }
    }
    Enums: {
      activity_kind:
        | "note"
        | "call"
        | "meeting"
        | "email"
        | "whatsapp"
        | "stage_change"
        | "form"
        | "chat"
        | "system"
      app_locale: "es" | "en"
      author_kind: "human" | "nexo" | "system"
      catalog_platform: "web" | "app"
      contact_kind: "prospect" | "client" | "recruiter" | "partner" | "other"
      contact_source:
        | "manual"
        | "import"
        | "form"
        | "nexo"
        | "whatsapp"
        | "radar"
      contact_via: "hiring" | "freelance" | "project"
      conversation_kind: "visitor" | "closer" | "client" | "freelance"
      conversation_status: "open" | "archived"
      deal_stage: "new" | "contacted" | "meeting" | "proposal" | "won" | "lost"
      extra_billing: "once" | "monthly" | "yearly" | "per_unit"
      job_kind:
        | "chat.reply"
        | "chat.summary"
        | "rag.index"
        | "radar.scan"
        | "radar.score"
        | "radar.draft"
        | "radar.send"
        | "account.delete"
        | "notify.send"
      job_status: "queued" | "running" | "done" | "failed" | "cancelled"
      lead_source: "form" | "nexo" | "whatsapp" | "radar" | "manual"
      lead_status: "new" | "assigned" | "contacted" | "converted" | "discarded"
      member_role: "owner" | "closer" | "client" | "freelance"
      message_kind: "text" | "handoff" | "reference"
      notification_event: "lead_new" | "lead_claimed" | "message_new" | "commission_accrued" | "payment_recorded" | "payment_overdue" | "payout_paid" | "job_failed" | "omen_down" | "invitation_accepted"
      outbox_channel: "email" | "telegram"
      outbox_status: "queued" | "sending" | "sent" | "failed"
      payout_cadence: "per_payment" | "weekly" | "biweekly"
      system_event:
        | "member_added"
        | "member_left"
        | "ai_on"
        | "ai_off"
        | "consent_granted"
        | "consent_revoked"
        | "archived"
        | "handoff_done"
      user_role: "admin" | "closer" | "freelance" | "client"
    }
    CompositeTypes: {
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      activity_kind: [
        "note",
        "call",
        "meeting",
        "email",
        "whatsapp",
        "stage_change",
        "form",
        "chat",
        "system",
      ],
      app_locale: ["es", "en"],
      author_kind: ["human", "nexo", "system"],
      catalog_platform: ["web", "app"],
      contact_kind: ["prospect", "client", "recruiter", "partner", "other"],
      contact_source: ["manual", "import", "form", "nexo", "whatsapp", "radar"],
      contact_via: ["hiring", "freelance", "project"],
      conversation_kind: ["visitor", "closer", "client", "freelance"],
      conversation_status: ["open", "archived"],
      deal_stage: ["new", "contacted", "meeting", "proposal", "won", "lost"],
      extra_billing: ["once", "monthly", "yearly", "per_unit"],
      job_kind: [
        "chat.reply",
        "chat.summary",
        "rag.index",
        "radar.scan",
        "radar.score",
        "radar.draft",
        "radar.send",
        "account.delete",
        "notify.send",
      ],
      job_status: ["queued", "running", "done", "failed", "cancelled"],
      lead_source: ["form", "nexo", "whatsapp", "radar", "manual"],
      lead_status: ["new", "assigned", "contacted", "converted", "discarded"],
      member_role: ["owner", "closer", "client", "freelance"],
      message_kind: ["text", "handoff", "reference"],
      notification_event: ["lead_new", "lead_claimed", "message_new", "commission_accrued", "payment_recorded", "payment_overdue", "payout_paid", "job_failed", "omen_down", "invitation_accepted"],
      outbox_channel: ["email", "telegram"],
      outbox_status: ["queued", "sending", "sent", "failed"],
      payout_cadence: ["per_payment", "weekly", "biweekly"],
      system_event: [
        "member_added",
        "member_left",
        "ai_on",
        "ai_off",
        "consent_granted",
        "consent_revoked",
        "archived",
        "handoff_done",
      ],
      user_role: ["admin", "closer", "freelance", "client"],
    },
  },
} as const
