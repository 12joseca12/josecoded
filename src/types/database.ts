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
          {
            foreignKeyName: "invitations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      projects: {
        Row: {
          archived_at: string | null
          brief: string | null
          client_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          due_at: string | null
          freelance_id: string | null
          id: string
          name: string
          offer_slug: string | null
          phase: Database["public"]["Enums"]["project_phase"]
          started_at: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          brief?: string | null
          client_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          due_at?: string | null
          freelance_id?: string | null
          id?: string
          name: string
          offer_slug?: string | null
          phase?: Database["public"]["Enums"]["project_phase"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          brief?: string | null
          client_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          due_at?: string | null
          freelance_id?: string | null
          id?: string
          name?: string
          offer_slug?: string | null
          phase?: Database["public"]["Enums"]["project_phase"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_deal_fkey"
            columns: ["deal_id", "contact_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id", "contact_id"]
          },
          {
            foreignKeyName: "projects_freelance_id_fkey"
            columns: ["freelance_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_freelance_id_fkey"
            columns: ["freelance_id"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_offer_slug_fkey"
            columns: ["offer_slug"]
            isOneToOne: false
            referencedRelation: "offers"
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
      stories: {
        Row: {
          as_a: string
          author_id: string | null
          confirmed_at: string | null
          created_at: string
          criteria: string[]
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          estimate_amount: number | null
          estimate_hours: number | null
          i_want: string
          id: string
          out_of_scope: boolean
          project_id: string
          so_that: string
          status: Database["public"]["Enums"]["story_status"]
          task_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          as_a: string
          author_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          criteria?: string[]
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          estimate_amount?: number | null
          estimate_hours?: number | null
          i_want: string
          id?: string
          out_of_scope?: boolean
          project_id: string
          so_that: string
          status?: Database["public"]["Enums"]["story_status"]
          task_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          as_a?: string
          author_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          criteria?: string[]
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          estimate_amount?: number | null
          estimate_hours?: number | null
          i_want?: string
          id?: string
          out_of_scope?: boolean
          project_id?: string
          so_that?: string
          status?: Database["public"]["Enums"]["story_status"]
          task_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          description: string | null
          done_at: string | null
          done_by: string | null
          id: string
          phase: Database["public"]["Enums"]["project_phase"]
          project_id: string
          sort: number
          status: Database["public"]["Enums"]["task_status"]
          story_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          done_at?: string | null
          done_by?: string | null
          id?: string
          phase: Database["public"]["Enums"]["project_phase"]
          project_id: string
          sort?: number
          status?: Database["public"]["Enums"]["task_status"]
          story_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          done_at?: string | null
          done_by?: string | null
          id?: string
          phase?: Database["public"]["Enums"]["project_phase"]
          project_id?: string
          sort?: number
          status?: Database["public"]["Enums"]["task_status"]
          story_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_done_by_fkey"
            columns: ["done_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_done_by_fkey"
            columns: ["done_by"]
            isOneToOne: false
            referencedRelation: "team_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      freelance_projects: {
        Row: {
          archived_at: string | null
          brief: string | null
          created_at: string | null
          done: number | null
          due_at: string | null
          id: string | null
          name: string | null
          percent: number | null
          phase: Database["public"]["Enums"]["project_phase"] | null
          started_at: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          total: number | null
        }
        Insert: {
          archived_at?: string | null
          brief?: string | null
          created_at?: string | null
          done?: number | null
          due_at?: string | null
          id?: string | null
          name?: string | null
          percent?: number | null
          phase?: Database["public"]["Enums"]["project_phase"] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          total?: number | null
        }
        Update: {
          archived_at?: string | null
          brief?: string | null
          created_at?: string | null
          done?: number | null
          due_at?: string | null
          id?: string | null
          name?: string | null
          percent?: number | null
          phase?: Database["public"]["Enums"]["project_phase"] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          total?: number | null
        }
        Relationships: []
      }
      project_overview: {
        Row: {
          archived_at: string | null
          client_id: string | null
          client_name: string | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          done: number | null
          due_at: string | null
          freelance_id: string | null
          freelance_name: string | null
          id: string | null
          name: string | null
          offer_slug: string | null
          percent: number | null
          phase: Database["public"]["Enums"]["project_phase"] | null
          started_at: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          stories_to_decide: number | null
          total: number | null
        }
        Insert: {
          archived_at?: string | null
          client_id?: string | null
          client_name?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          done?: number | null
          due_at?: string | null
          freelance_id?: string | null
          freelance_name?: string | null
          id?: string | null
          name?: string | null
          offer_slug?: string | null
          percent?: number | null
          phase?: Database["public"]["Enums"]["project_phase"] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          stories_to_decide?: number | null
          total?: number | null
        }
        Update: {
          archived_at?: string | null
          client_id?: string | null
          client_name?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          done?: number | null
          due_at?: string | null
          freelance_id?: string | null
          freelance_name?: string | null
          id?: string | null
          name?: string | null
          offer_slug?: string | null
          percent?: number | null
          phase?: Database["public"]["Enums"]["project_phase"] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          stories_to_decide?: number | null
          total?: number | null
        }
        Relationships: []
      }
      project_progress: {
        Row: {
          done: number | null
          percent: number | null
          project_id: string | null
          total: number | null
        }
        Insert: {
          done?: number | null
          percent?: number | null
          project_id?: string | null
          total?: number | null
        }
        Update: {
          done?: number | null
          percent?: number | null
          project_id?: string | null
          total?: number | null
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
      archive_project: {
        Args: { p_archived?: boolean; p_id: string }
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
      complete_my_task: {
        Args: { p_id: string }
        Returns: undefined
      }
      confirm_story: {
        Args: { p_accept?: boolean; p_id: string }
        Returns: Database["public"]["Enums"]["story_status"]
      }
      create_project: {
        Args: { p_brief?: string; p_contact_id?: string; p_deal_id?: string; p_due_at?: string; p_freelance_id?: string; p_name: string; p_offer_slug?: string; p_started_at?: string }
        Returns: string
      }
      decide_story: {
        Args: { p_amount?: number; p_create_task?: boolean; p_decision: string; p_hours?: number; p_id: string; p_note?: string }
        Returns: Database["public"]["Enums"]["story_status"]
      }
      delete_task: {
        Args: { p_id: string }
        Returns: undefined
      }
      discard_lead: {
        Args: { p_lead_id: string; p_reason: string }
        Returns: undefined
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
      log_totp_reset: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      mark_notifications_read: {
        Args: { p_ids: string[] }
        Returns: number
      }
      move_task: {
        Args: { p_id: string; p_phase: Database["public"]["Enums"]["project_phase"]; p_sort: number }
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
      set_notification_pref: {
        Args: { p_channel: string; p_enabled: boolean; p_event: Database["public"]["Enums"]["notification_event"] }
        Returns: undefined
      }
      set_project_client: {
        Args: { p_id: string; p_user_id: string }
        Returns: undefined
      }
      set_project_freelance: {
        Args: { p_id: string; p_user_id?: string }
        Returns: undefined
      }
      set_project_phase: {
        Args: { p_id: string; p_phase: Database["public"]["Enums"]["project_phase"] }
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
      upsert_task: {
        Args: { p_assignee_id?: string; p_description?: string; p_id?: string; p_phase: Database["public"]["Enums"]["project_phase"]; p_project_id: string; p_status?: Database["public"]["Enums"]["task_status"]; p_story_id?: string; p_title: string }
        Returns: string
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
      notification_event: "lead_new" | "lead_claimed" | "message_new" | "commission_accrued" | "payment_recorded" | "payment_overdue" | "payout_paid" | "job_failed" | "omen_down" | "invitation_accepted"
      outbox_channel: "email" | "telegram"
      outbox_status: "queued" | "sending" | "sent" | "failed"
      payout_cadence: "per_payment" | "weekly" | "biweekly"
      project_phase: "discover" | "design" | "build" | "publish" | "maintain"
      project_status: "active" | "paused" | "closed"
      story_status: "proposed" | "in_review" | "accepted" | "rejected" | "in_tasks"
      task_status: "todo" | "doing" | "done"
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
      catalog_platform: ["web", "app"],
      contact_kind: ["prospect", "client", "recruiter", "partner", "other"],
      contact_source: ["manual", "import", "form", "nexo", "whatsapp", "radar"],
      contact_via: ["hiring", "freelance", "project"],
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
      notification_event: ["lead_new", "lead_claimed", "message_new", "commission_accrued", "payment_recorded", "payment_overdue", "payout_paid", "job_failed", "omen_down", "invitation_accepted"],
      outbox_channel: ["email", "telegram"],
      outbox_status: ["queued", "sending", "sent", "failed"],
      payout_cadence: ["per_payment", "weekly", "biweekly"],
      project_phase: ["discover", "design", "build", "publish", "maintain"],
      project_status: ["active", "paused", "closed"],
      story_status: ["proposed", "in_review", "accepted", "rejected", "in_tasks"],
      task_status: ["todo", "doing", "done"],
      user_role: ["admin", "closer", "freelance", "client"],
    },
  },
} as const
