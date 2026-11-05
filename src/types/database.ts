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
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          locale: Database["public"]["Enums"]["app_locale"]
          parent_closer_id: string | null
          parent_rate: number | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          closer_rate?: number | null
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          locale?: Database["public"]["Enums"]["app_locale"]
          parent_closer_id?: string | null
          parent_rate?: number | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          closer_rate?: number | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          locale?: Database["public"]["Enums"]["app_locale"]
          parent_closer_id?: string | null
          parent_rate?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
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
    }
    Views: {
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
      assign_lead: {
        Args: { p_lead_id: string; p_user_id: string }
        Returns: string
      }
      claim_lead: {
        Args: { p_lead_id: string }
        Returns: string
      }
      discard_lead: {
        Args: { p_lead_id: string; p_reason: string }
        Returns: undefined
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
      lead_source: "form" | "nexo" | "whatsapp" | "radar" | "manual"
      lead_status: "new" | "assigned" | "contacted" | "converted" | "discarded"
      user_role: "admin" | "closer" | "freelance" | "client"
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
      lead_source: ["form", "nexo", "whatsapp", "radar", "manual"],
      lead_status: ["new", "assigned", "contacted", "converted", "discarded"],
      user_role: ["admin", "closer", "freelance", "client"],
    },
  },
} as const
