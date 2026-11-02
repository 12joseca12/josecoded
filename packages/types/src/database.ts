
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "affiliate_rewards": {
                  Row: {
                    "affiliate_id": string,"amount": number,"base_amount": number | null,"created_at": string,"id": string,"lead_id": string,"paid_at": string | null,"percent": number | null,"pricing_version": string | null,"status": Database["public"]['Enums']["reward_status"],"type": Database["public"]['Enums']["reward_type"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "affiliate_id": string,"amount": number,"base_amount"?: number | null,"created_at"?: string,"id"?: string,"lead_id": string,"paid_at"?: string | null,"percent"?: number | null,"pricing_version"?: string | null,"status"?: Database["public"]['Enums']["reward_status"],"type": Database["public"]['Enums']["reward_type"],"updated_at"?: string
                  }
                  Update: {
                    "affiliate_id"?: string,"amount"?: number,"base_amount"?: number | null,"created_at"?: string,"id"?: string,"lead_id"?: string,"paid_at"?: string | null,"percent"?: number | null,"pricing_version"?: string | null,"status"?: Database["public"]['Enums']["reward_status"],"type"?: Database["public"]['Enums']["reward_type"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "affiliate_rewards_affiliate_id_fkey"
      columns: ["affiliate_id"]
isOneToOne: false
      referencedRelation: "affiliates"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "affiliate_rewards_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: true
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
                  ]
                },"affiliates": {
                  Row: {
                    "code": string,"created_at": string,"id": string,"level": Database["public"]['Enums']["affiliate_level"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"id"?: string,"level"?: Database["public"]['Enums']["affiliate_level"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"id"?: string,"level"?: Database["public"]['Enums']["affiliate_level"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"blog_comments": {
                  Row: {
                    "author_name": string,"body": string,"created_at": string,"id": string,"locale": Database["public"]['Enums']["locale"],"moderated_at": string | null,"moderated_by": string | null,"parent_id": string | null,"post_slug": string,"status": Database["public"]['Enums']["comment_status"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_name": string,"body": string,"created_at"?: string,"id"?: string,"locale": Database["public"]['Enums']["locale"],"moderated_at"?: string | null,"moderated_by"?: string | null,"parent_id"?: string | null,"post_slug": string,"status"?: Database["public"]['Enums']["comment_status"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "author_name"?: string,"body"?: string,"created_at"?: string,"id"?: string,"locale"?: Database["public"]['Enums']["locale"],"moderated_at"?: string | null,"moderated_by"?: string | null,"parent_id"?: string | null,"post_slug"?: string,"status"?: Database["public"]['Enums']["comment_status"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "blog_comments_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "blog_comments"
      referencedColumns: ["id"]
    }
                  ]
                },"chat_contexts": {
                  Row: {
                    "body_md": string,"case": Database["public"]['Enums']["chat_case"],"created_at": string,"facts": NonNullable<Json>,"id": string,"locale": Database["public"]['Enums']["locale"],"notes": string | null,"published_at": string | null,"published_by": string | null,"status": Database["public"]['Enums']["context_status"],"title": string | null,"updated_at": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "body_md": string,"case": Database["public"]['Enums']["chat_case"],"created_at"?: string,"facts"?: NonNullable<Json>,"id"?: string,"locale": Database["public"]['Enums']["locale"],"notes"?: string | null,"published_at"?: string | null,"published_by"?: string | null,"status"?: Database["public"]['Enums']["context_status"],"title"?: string | null,"updated_at"?: string,"version": number
                  }
                  Update: {
                    "body_md"?: string,"case"?: Database["public"]['Enums']["chat_case"],"created_at"?: string,"facts"?: NonNullable<Json>,"id"?: string,"locale"?: Database["public"]['Enums']["locale"],"notes"?: string | null,"published_at"?: string | null,"published_by"?: string | null,"status"?: Database["public"]['Enums']["context_status"],"title"?: string | null,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    
                  ]
                },"chat_messages": {
                  Row: {
                    "content": string,"created_at": string,"id": string,"message_type": Database["public"]['Enums']["chat_message_type"],"metadata": NonNullable<Json>,"sender_role": Database["public"]['Enums']["chat_sender"],"thread_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "content": string,"created_at"?: string,"id"?: string,"message_type"?: Database["public"]['Enums']["chat_message_type"],"metadata"?: NonNullable<Json>,"sender_role": Database["public"]['Enums']["chat_sender"],"thread_id": string
                  }
                  Update: {
                    "content"?: string,"created_at"?: string,"id"?: string,"message_type"?: Database["public"]['Enums']["chat_message_type"],"metadata"?: NonNullable<Json>,"sender_role"?: Database["public"]['Enums']["chat_sender"],"thread_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "chat_messages_thread_id_fkey"
      columns: ["thread_id"]
isOneToOne: false
      referencedRelation: "chat_threads"
      referencedColumns: ["id"]
    }
                  ]
                },"chat_threads": {
                  Row: {
                    "ai_enabled": boolean,"case": Database["public"]['Enums']["chat_case"],"contact_id": string | null,"context_version": number | null,"created_at": string,"id": string,"ip_hash": string | null,"last_message_at": string | null,"locale": Database["public"]['Enums']["locale"],"origin_path": string | null,"status": Database["public"]['Enums']["thread_status"],"unread_for_admin": boolean,"updated_at": string,"user_id": string | null,"visitor_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ai_enabled"?: boolean,"case": Database["public"]['Enums']["chat_case"],"contact_id"?: string | null,"context_version"?: number | null,"created_at"?: string,"id"?: string,"ip_hash"?: string | null,"last_message_at"?: string | null,"locale": Database["public"]['Enums']["locale"],"origin_path"?: string | null,"status"?: Database["public"]['Enums']["thread_status"],"unread_for_admin"?: boolean,"updated_at"?: string,"user_id"?: string | null,"visitor_id": string
                  }
                  Update: {
                    "ai_enabled"?: boolean,"case"?: Database["public"]['Enums']["chat_case"],"contact_id"?: string | null,"context_version"?: number | null,"created_at"?: string,"id"?: string,"ip_hash"?: string | null,"last_message_at"?: string | null,"locale"?: Database["public"]['Enums']["locale"],"origin_path"?: string | null,"status"?: Database["public"]['Enums']["thread_status"],"unread_for_admin"?: boolean,"updated_at"?: string,"user_id"?: string | null,"visitor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "chat_threads_contact_id_fkey"
      columns: ["contact_id"]
isOneToOne: false
      referencedRelation: "crm_contacts"
      referencedColumns: ["id"]
    }
                  ]
                },"client_assets": {
                  Row: {
                    "client_id": string,"created_at": string,"description": string | null,"file_name": string | null,"id": string,"mime_type": string | null,"size_bytes": number | null,"source": Database["public"]['Enums']["asset_source"],"storage_path": string,"title": string | null,"uploaded_by_user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"created_at"?: string,"description"?: string | null,"file_name"?: string | null,"id"?: string,"mime_type"?: string | null,"size_bytes"?: number | null,"source": Database["public"]['Enums']["asset_source"],"storage_path": string,"title"?: string | null,"uploaded_by_user_id"?: string | null
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"description"?: string | null,"file_name"?: string | null,"id"?: string,"mime_type"?: string | null,"size_bytes"?: number | null,"source"?: Database["public"]['Enums']["asset_source"],"storage_path"?: string,"title"?: string | null,"uploaded_by_user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "client_assets_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    }
                  ]
                },"client_extras": {
                  Row: {
                    "amount": number | null,"client_id": string,"created_at": string,"extra_code": string,"free": boolean,"id": string,"source_lead_id": string | null,"status": Database["public"]['Enums']["client_extra_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount"?: number | null,"client_id": string,"created_at"?: string,"extra_code": string,"free"?: boolean,"id"?: string,"source_lead_id"?: string | null,"status": Database["public"]['Enums']["client_extra_status"],"updated_at"?: string
                  }
                  Update: {
                    "amount"?: number | null,"client_id"?: string,"created_at"?: string,"extra_code"?: string,"free"?: boolean,"id"?: string,"source_lead_id"?: string | null,"status"?: Database["public"]['Enums']["client_extra_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "client_extras_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "client_extras_extra_code_fkey"
      columns: ["extra_code"]
isOneToOne: false
      referencedRelation: "extras"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "client_extras_source_lead_id_fkey"
      columns: ["source_lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
                  ]
                },"client_task_comments": {
                  Row: {
                    "author_user_id": string | null,"body": string,"client_id": string,"created_at": string,"id": string,"internal": boolean,"task_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "author_user_id"?: string | null,"body": string,"client_id": string,"created_at"?: string,"id"?: string,"internal"?: boolean,"task_id"?: string | null
                  }
                  Update: {
                    "author_user_id"?: string | null,"body"?: string,"client_id"?: string,"created_at"?: string,"id"?: string,"internal"?: boolean,"task_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "client_task_comments_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "client_task_comments_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "client_tasks"
      referencedColumns: ["id"]
    }
                  ]
                },"client_tasks": {
                  Row: {
                    "client_id": string,"created_at": string,"description": string | null,"due_at": string | null,"id": string,"sort": number,"status": Database["public"]['Enums']["task_status"],"story_id": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"created_at"?: string,"description"?: string | null,"due_at"?: string | null,"id"?: string,"sort"?: number,"status"?: Database["public"]['Enums']["task_status"],"story_id"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"description"?: string | null,"due_at"?: string | null,"id"?: string,"sort"?: number,"status"?: Database["public"]['Enums']["task_status"],"story_id"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "client_tasks_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "client_tasks_story_id_fkey"
      columns: ["story_id"]
isOneToOne: false
      referencedRelation: "client_user_stories"
      referencedColumns: ["id"]
    }
                  ]
                },"client_user_stories": {
                  Row: {
                    "acceptance_criteria": (string)[],"as_a": string,"author_user_id": string | null,"client_id": string,"created_at": string,"decided_at": string | null,"decided_by": string | null,"estimate_amount": number | null,"estimate_hours": number | null,"estimate_note": string | null,"i_want": string,"id": string,"so_that": string,"sort": number | null,"status": Database["public"]['Enums']["story_status"],"task_id": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "acceptance_criteria"?: (string)[],"as_a": string,"author_user_id"?: string | null,"client_id": string,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"estimate_amount"?: number | null,"estimate_hours"?: number | null,"estimate_note"?: string | null,"i_want": string,"id"?: string,"so_that": string,"sort"?: number | null,"status"?: Database["public"]['Enums']["story_status"],"task_id"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "acceptance_criteria"?: (string)[],"as_a"?: string,"author_user_id"?: string | null,"client_id"?: string,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"estimate_amount"?: number | null,"estimate_hours"?: number | null,"estimate_note"?: string | null,"i_want"?: string,"id"?: string,"so_that"?: string,"sort"?: number | null,"status"?: Database["public"]['Enums']["story_status"],"task_id"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "client_user_stories_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "client_user_stories_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "client_tasks"
      referencedColumns: ["id"]
    }
                  ]
                },"clients": {
                  Row: {
                    "contact_id": string,"created_at": string,"delivered_at": string | null,"id": string,"invite_email": string | null,"lead_id": string | null,"notes_internal": string | null,"pack_code": string,"pack_option": string | null,"project_phase": Database["public"]['Enums']["project_phase"],"starts_at": string | null,"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "contact_id": string,"created_at"?: string,"delivered_at"?: string | null,"id"?: string,"invite_email"?: string | null,"lead_id"?: string | null,"notes_internal"?: string | null,"pack_code": string,"pack_option"?: string | null,"project_phase"?: Database["public"]['Enums']["project_phase"],"starts_at"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "contact_id"?: string,"created_at"?: string,"delivered_at"?: string | null,"id"?: string,"invite_email"?: string | null,"lead_id"?: string | null,"notes_internal"?: string | null,"pack_code"?: string,"pack_option"?: string | null,"project_phase"?: Database["public"]['Enums']["project_phase"],"starts_at"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "clients_contact_id_fkey"
      columns: ["contact_id"]
isOneToOne: false
      referencedRelation: "crm_contacts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "clients_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "clients_pack_code_fkey"
      columns: ["pack_code"]
isOneToOne: false
      referencedRelation: "packs"
      referencedColumns: ["code"]
    }
                  ]
                },"closer_commissions": {
                  Row: {
                    "amount": number,"approved_at": string | null,"approved_by": string | null,"base_amount": number,"closer_id": string,"contact_id": string,"created_at": string,"id": string,"lead_id": string,"paid_at": string | null,"paid_note": string | null,"percent": number,"rejected_reason": string | null,"status": Database["public"]['Enums']["commission_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"approved_at"?: string | null,"approved_by"?: string | null,"base_amount": number,"closer_id": string,"contact_id": string,"created_at"?: string,"id"?: string,"lead_id": string,"paid_at"?: string | null,"paid_note"?: string | null,"percent": number,"rejected_reason"?: string | null,"status"?: Database["public"]['Enums']["commission_status"],"updated_at"?: string
                  }
                  Update: {
                    "amount"?: number,"approved_at"?: string | null,"approved_by"?: string | null,"base_amount"?: number,"closer_id"?: string,"contact_id"?: string,"created_at"?: string,"id"?: string,"lead_id"?: string,"paid_at"?: string | null,"paid_note"?: string | null,"percent"?: number,"rejected_reason"?: string | null,"status"?: Database["public"]['Enums']["commission_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "closer_commissions_closer_id_fkey"
      columns: ["closer_id"]
isOneToOne: false
      referencedRelation: "staff_members"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "closer_commissions_contact_id_fkey"
      columns: ["contact_id"]
isOneToOne: false
      referencedRelation: "crm_contacts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "closer_commissions_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
                  ]
                },"crm_contacts": {
                  Row: {
                    "archived_at": string | null,"chat_case": Database["public"]['Enums']["chat_case"] | null,"created_at": string,"display_name": string,"email": string | null,"id": string,"kind": Database["public"]['Enums']["contact_kind"],"last_interaction_at": string | null,"linkedin_url": string | null,"locale": Database["public"]['Enums']["locale"] | null,"next_action": string | null,"next_action_at": string | null,"notion_url": string | null,"organization_id": string | null,"owner_id": string | null,"owner_note": string | null,"phone": string | null,"role": string | null,"source": Database["public"]['Enums']["contact_source"],"status": string,"tags": (string)[],"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"chat_case"?: Database["public"]['Enums']["chat_case"] | null,"created_at"?: string,"display_name": string,"email"?: string | null,"id"?: string,"kind": Database["public"]['Enums']["contact_kind"],"last_interaction_at"?: string | null,"linkedin_url"?: string | null,"locale"?: Database["public"]['Enums']["locale"] | null,"next_action"?: string | null,"next_action_at"?: string | null,"notion_url"?: string | null,"organization_id"?: string | null,"owner_id"?: string | null,"owner_note"?: string | null,"phone"?: string | null,"role"?: string | null,"source": Database["public"]['Enums']["contact_source"],"status": string,"tags"?: (string)[],"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "archived_at"?: string | null,"chat_case"?: Database["public"]['Enums']["chat_case"] | null,"created_at"?: string,"display_name"?: string,"email"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["contact_kind"],"last_interaction_at"?: string | null,"linkedin_url"?: string | null,"locale"?: Database["public"]['Enums']["locale"] | null,"next_action"?: string | null,"next_action_at"?: string | null,"notion_url"?: string | null,"organization_id"?: string | null,"owner_id"?: string | null,"owner_note"?: string | null,"phone"?: string | null,"role"?: string | null,"source"?: Database["public"]['Enums']["contact_source"],"status"?: string,"tags"?: (string)[],"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "crm_contacts_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "crm_organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "crm_contacts_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "staff_members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"crm_import_conflicts": {
                  Row: {
                    "created_at": string,"existing_contact_id": string,"existing_owner_id": string | null,"id": string,"import_id": string,"owner_id": string,"resolution": Database["public"]['Enums']["conflict_resolution"] | null,"resolution_note": string | null,"resolved_at": string | null,"resolved_by": string | null,"row": NonNullable<Json>,"row_index": number,"status": Database["public"]['Enums']["conflict_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"existing_contact_id": string,"existing_owner_id"?: string | null,"id"?: string,"import_id": string,"owner_id": string,"resolution"?: Database["public"]['Enums']["conflict_resolution"] | null,"resolution_note"?: string | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"row": NonNullable<Json>,"row_index": number,"status"?: Database["public"]['Enums']["conflict_status"]
                  }
                  Update: {
                    "created_at"?: string,"existing_contact_id"?: string,"existing_owner_id"?: string | null,"id"?: string,"import_id"?: string,"owner_id"?: string,"resolution"?: Database["public"]['Enums']["conflict_resolution"] | null,"resolution_note"?: string | null,"resolved_at"?: string | null,"resolved_by"?: string | null,"row"?: NonNullable<Json>,"row_index"?: number,"status"?: Database["public"]['Enums']["conflict_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "crm_import_conflicts_existing_contact_id_fkey"
      columns: ["existing_contact_id"]
isOneToOne: false
      referencedRelation: "crm_contacts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "crm_import_conflicts_import_id_fkey"
      columns: ["import_id"]
isOneToOne: false
      referencedRelation: "crm_imports"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "crm_import_conflicts_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "staff_members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"crm_imports": {
                  Row: {
                    "checksum": string,"conflicts_count": number,"created_at": string,"created_count": number,"errors": NonNullable<Json>,"file_name": string | null,"id": string,"owner_id": string,"row_count": number,"skipped_count": number,"status": Database["public"]['Enums']["import_status"],"updated_count": number
                  }
                  ComputedFields: never
                  Insert: {
                    "checksum": string,"conflicts_count"?: number,"created_at"?: string,"created_count"?: number,"errors"?: NonNullable<Json>,"file_name"?: string | null,"id"?: string,"owner_id": string,"row_count"?: number,"skipped_count"?: number,"status"?: Database["public"]['Enums']["import_status"],"updated_count"?: number
                  }
                  Update: {
                    "checksum"?: string,"conflicts_count"?: number,"created_at"?: string,"created_count"?: number,"errors"?: NonNullable<Json>,"file_name"?: string | null,"id"?: string,"owner_id"?: string,"row_count"?: number,"skipped_count"?: number,"status"?: Database["public"]['Enums']["import_status"],"updated_count"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "crm_imports_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "staff_members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"crm_interactions": {
                  Row: {
                    "actor": Database["public"]['Enums']["interaction_actor"],"body": string | null,"channel": Database["public"]['Enums']["interaction_channel"] | null,"chat_thread_id": string | null,"contact_id": string,"created_at": string,"direction": Database["public"]['Enums']["interaction_direction"],"draft_id": string | null,"id": string,"kind": Database["public"]['Enums']["interaction_kind"],"lead_id": string | null,"occurred_at": string,"payload": NonNullable<Json>,"subject": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "actor": Database["public"]['Enums']["interaction_actor"],"body"?: string | null,"channel"?: Database["public"]['Enums']["interaction_channel"] | null,"chat_thread_id"?: string | null,"contact_id": string,"created_at"?: string,"direction"?: Database["public"]['Enums']["interaction_direction"],"draft_id"?: string | null,"id"?: string,"kind": Database["public"]['Enums']["interaction_kind"],"lead_id"?: string | null,"occurred_at"?: string,"payload"?: NonNullable<Json>,"subject"?: string | null
                  }
                  Update: {
                    "actor"?: Database["public"]['Enums']["interaction_actor"],"body"?: string | null,"channel"?: Database["public"]['Enums']["interaction_channel"] | null,"chat_thread_id"?: string | null,"contact_id"?: string,"created_at"?: string,"direction"?: Database["public"]['Enums']["interaction_direction"],"draft_id"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["interaction_kind"],"lead_id"?: string | null,"occurred_at"?: string,"payload"?: NonNullable<Json>,"subject"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "crm_interactions_chat_thread_id_fkey"
      columns: ["chat_thread_id"]
isOneToOne: false
      referencedRelation: "chat_threads"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "crm_interactions_contact_id_fkey"
      columns: ["contact_id"]
isOneToOne: false
      referencedRelation: "crm_contacts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "crm_interactions_draft_id_fkey"
      columns: ["draft_id"]
isOneToOne: false
      referencedRelation: "crm_message_drafts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "crm_interactions_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
                  ]
                },"crm_message_drafts": {
                  Row: {
                    "body": string,"channel": Database["public"]['Enums']["interaction_channel"],"char_count": number | null,"contact_id": string,"created_at": string,"generated_by": Database["public"]['Enums']["draft_author"],"id": string,"locale": Database["public"]['Enums']["locale"] | null,"marked_sent_at": string | null,"model": string | null,"prompt_version": string | null,"status": Database["public"]['Enums']["draft_status"],"subject": string | null,"template_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"channel": Database["public"]['Enums']["interaction_channel"],"char_count"?: never,"contact_id": string,"created_at"?: string,"generated_by": Database["public"]['Enums']["draft_author"],"id"?: string,"locale"?: Database["public"]['Enums']["locale"] | null,"marked_sent_at"?: string | null,"model"?: string | null,"prompt_version"?: string | null,"status"?: Database["public"]['Enums']["draft_status"],"subject"?: string | null,"template_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string,"channel"?: Database["public"]['Enums']["interaction_channel"],"char_count"?: never,"contact_id"?: string,"created_at"?: string,"generated_by"?: Database["public"]['Enums']["draft_author"],"id"?: string,"locale"?: Database["public"]['Enums']["locale"] | null,"marked_sent_at"?: string | null,"model"?: string | null,"prompt_version"?: string | null,"status"?: Database["public"]['Enums']["draft_status"],"subject"?: string | null,"template_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "crm_message_drafts_contact_id_fkey"
      columns: ["contact_id"]
isOneToOne: false
      referencedRelation: "crm_contacts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "crm_message_drafts_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "crm_message_templates"
      referencedColumns: ["id"]
    }
                  ]
                },"crm_message_templates": {
                  Row: {
                    "active": boolean,"body": string,"channel": Database["public"]['Enums']["interaction_channel"],"code": string,"created_at": string,"id": string,"kind": Database["public"]['Enums']["contact_kind"] | null,"locale": Database["public"]['Enums']["locale"],"max_chars": number | null,"rules": (string)[],"title": string | null,"updated_at": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"body": string,"channel": Database["public"]['Enums']["interaction_channel"],"code": string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["contact_kind"] | null,"locale": Database["public"]['Enums']["locale"],"max_chars"?: number | null,"rules"?: (string)[],"title"?: string | null,"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "active"?: boolean,"body"?: string,"channel"?: Database["public"]['Enums']["interaction_channel"],"code"?: string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["contact_kind"] | null,"locale"?: Database["public"]['Enums']["locale"],"max_chars"?: number | null,"rules"?: (string)[],"title"?: string | null,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    
                  ]
                },"crm_organizations": {
                  Row: {
                    "city": string | null,"created_at": string,"fit": number | null,"id": string,"kind": Database["public"]['Enums']["org_kind"],"name": string,"name_normalized": string,"notes": string | null,"notion_url": string | null,"size": string | null,"source": Database["public"]['Enums']["contact_source"],"updated_at": string,"website": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "city"?: string | null,"created_at"?: string,"fit"?: number | null,"id"?: string,"kind": Database["public"]['Enums']["org_kind"],"name": string,"name_normalized": string,"notes"?: string | null,"notion_url"?: string | null,"size"?: string | null,"source"?: Database["public"]['Enums']["contact_source"],"updated_at"?: string,"website"?: string | null
                  }
                  Update: {
                    "city"?: string | null,"created_at"?: string,"fit"?: number | null,"id"?: string,"kind"?: Database["public"]['Enums']["org_kind"],"name"?: string,"name_normalized"?: string,"notes"?: string | null,"notion_url"?: string | null,"size"?: string | null,"source"?: Database["public"]['Enums']["contact_source"],"updated_at"?: string,"website"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"custom_quote_items": {
                  Row: {
                    "extra_code": string,"id": string,"label": NonNullable<Json>,"line_total": number | null,"quantity": number,"quote_id": string,"sort": number | null,"unit_price": number
                  }
                  ComputedFields: never
                  Insert: {
                    "extra_code": string,"id"?: string,"label": NonNullable<Json>,"line_total"?: never,"quantity"?: number,"quote_id": string,"sort"?: number | null,"unit_price": number
                  }
                  Update: {
                    "extra_code"?: string,"id"?: string,"label"?: NonNullable<Json>,"line_total"?: never,"quantity"?: number,"quote_id"?: string,"sort"?: number | null,"unit_price"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "custom_quote_items_extra_code_fkey"
      columns: ["extra_code"]
isOneToOne: false
      referencedRelation: "extras"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "custom_quote_items_quote_id_fkey"
      columns: ["quote_id"]
isOneToOne: false
      referencedRelation: "custom_quotes"
      referencedColumns: ["id"]
    }
                  ]
                },"custom_quotes": {
                  Row: {
                    "contact_id": string,"created_at": string,"created_by": string | null,"decided_at": string | null,"discount_amount": number,"discount_note": string | null,"id": string,"lead_id": string | null,"notes": string | null,"pricing_version": string | null,"sent_at": string | null,"status": Database["public"]['Enums']["quote_status"],"subtotal": number,"title": string,"total": number,"updated_at": string,"valid_until": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "contact_id": string,"created_at"?: string,"created_by"?: string | null,"decided_at"?: string | null,"discount_amount"?: number,"discount_note"?: string | null,"id"?: string,"lead_id"?: string | null,"notes"?: string | null,"pricing_version"?: string | null,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["quote_status"],"subtotal"?: number,"title": string,"total"?: number,"updated_at"?: string,"valid_until"?: string | null
                  }
                  Update: {
                    "contact_id"?: string,"created_at"?: string,"created_by"?: string | null,"decided_at"?: string | null,"discount_amount"?: number,"discount_note"?: string | null,"id"?: string,"lead_id"?: string | null,"notes"?: string | null,"pricing_version"?: string | null,"sent_at"?: string | null,"status"?: Database["public"]['Enums']["quote_status"],"subtotal"?: number,"title"?: string,"total"?: number,"updated_at"?: string,"valid_until"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "custom_quotes_contact_id_fkey"
      columns: ["contact_id"]
isOneToOne: false
      referencedRelation: "crm_contacts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "custom_quotes_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
                  ]
                },"extras": {
                  Row: {
                    "active": boolean,"billing": Database["public"]['Enums']["extra_billing"],"code": string,"deleted_at": string | null,"description": Json | null,"name": NonNullable<Json>,"price": number,"pricing_version": string,"sort": number | null,"updated_at": string,"updated_by": string | null,"visible": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"billing"?: Database["public"]['Enums']["extra_billing"],"code": string,"deleted_at"?: string | null,"description"?: Json | null,"name"?: NonNullable<Json>,"price": number,"pricing_version": string,"sort"?: number | null,"updated_at"?: string,"updated_by"?: string | null,"visible"?: boolean
                  }
                  Update: {
                    "active"?: boolean,"billing"?: Database["public"]['Enums']["extra_billing"],"code"?: string,"deleted_at"?: string | null,"description"?: Json | null,"name"?: NonNullable<Json>,"price"?: number,"pricing_version"?: string,"sort"?: number | null,"updated_at"?: string,"updated_by"?: string | null,"visible"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"leads": {
                  Row: {
                    "affiliate_code": string | null,"ai_proposal": Json | null,"amount": number | null,"contact_id": string,"created_at": string,"created_by": string | null,"id": string,"idempotency_key": string | null,"locale": Database["public"]['Enums']["locale"] | null,"message": string | null,"meta": NonNullable<Json>,"pack_code": string | null,"pack_option": string | null,"paid_at": string | null,"source": Database["public"]['Enums']["lead_source"],"status": Database["public"]['Enums']["lead_status"],"updated_at": string,"user_id": string | null,"via": Database["public"]['Enums']["contact_via"]
                  }
                  ComputedFields: never
                  Insert: {
                    "affiliate_code"?: string | null,"ai_proposal"?: Json | null,"amount"?: number | null,"contact_id": string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"idempotency_key"?: string | null,"locale"?: Database["public"]['Enums']["locale"] | null,"message"?: string | null,"meta"?: NonNullable<Json>,"pack_code"?: string | null,"pack_option"?: string | null,"paid_at"?: string | null,"source": Database["public"]['Enums']["lead_source"],"status"?: Database["public"]['Enums']["lead_status"],"updated_at"?: string,"user_id"?: string | null,"via"?: Database["public"]['Enums']["contact_via"]
                  }
                  Update: {
                    "affiliate_code"?: string | null,"ai_proposal"?: Json | null,"amount"?: number | null,"contact_id"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"idempotency_key"?: string | null,"locale"?: Database["public"]['Enums']["locale"] | null,"message"?: string | null,"meta"?: NonNullable<Json>,"pack_code"?: string | null,"pack_option"?: string | null,"paid_at"?: string | null,"source"?: Database["public"]['Enums']["lead_source"],"status"?: Database["public"]['Enums']["lead_status"],"updated_at"?: string,"user_id"?: string | null,"via"?: Database["public"]['Enums']["contact_via"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "leads_affiliate_code_fkey"
      columns: ["affiliate_code"]
isOneToOne: false
      referencedRelation: "affiliates"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "leads_contact_id_fkey"
      columns: ["contact_id"]
isOneToOne: false
      referencedRelation: "crm_contacts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_pack_code_fkey"
      columns: ["pack_code"]
isOneToOne: false
      referencedRelation: "packs"
      referencedColumns: ["code"]
    }
                  ]
                },"notification_rules": {
                  Row: {
                    "channel": Database["public"]['Enums']["notification_channel"],"created_at": string,"enabled": boolean,"event": string,"id": string,"recipient": Database["public"]['Enums']["notification_recipient"],"recipient_user_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "channel": Database["public"]['Enums']["notification_channel"],"created_at"?: string,"enabled"?: boolean,"event": string,"id"?: string,"recipient": Database["public"]['Enums']["notification_recipient"],"recipient_user_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "channel"?: Database["public"]['Enums']["notification_channel"],"created_at"?: string,"enabled"?: boolean,"event"?: string,"id"?: string,"recipient"?: Database["public"]['Enums']["notification_recipient"],"recipient_user_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notification_rules_recipient_user_id_fkey"
      columns: ["recipient_user_id"]
isOneToOne: false
      referencedRelation: "staff_members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"pack_options": {
                  Row: {
                    "code": string,"deleted_at": string | null,"for_whom": Json | null,"includes": NonNullable<Json>,"name": NonNullable<Json>,"pack_code": string,"price": number,"pricing_version": string,"visible": boolean,"weeks": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"deleted_at"?: string | null,"for_whom"?: Json | null,"includes"?: NonNullable<Json>,"name"?: NonNullable<Json>,"pack_code": string,"price": number,"pricing_version": string,"visible"?: boolean,"weeks"?: number | null
                  }
                  Update: {
                    "code"?: string,"deleted_at"?: string | null,"for_whom"?: Json | null,"includes"?: NonNullable<Json>,"name"?: NonNullable<Json>,"pack_code"?: string,"price"?: number,"pricing_version"?: string,"visible"?: boolean,"weeks"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "pack_options_pack_code_fkey"
      columns: ["pack_code"]
isOneToOne: false
      referencedRelation: "packs"
      referencedColumns: ["code"]
    }
                  ]
                },"packs": {
                  Row: {
                    "active": boolean,"code": string,"deleted_at": string | null,"for_whom": Json | null,"includes": NonNullable<Json>,"kind": Database["public"]['Enums']["pack_kind"],"name": NonNullable<Json>,"price": number,"pricing_version": string,"slug": string | null,"sort": number | null,"updated_at": string,"updated_by": string | null,"visible": boolean,"weeks": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"code": string,"deleted_at"?: string | null,"for_whom"?: Json | null,"includes"?: NonNullable<Json>,"kind"?: Database["public"]['Enums']["pack_kind"],"name"?: NonNullable<Json>,"price": number,"pricing_version": string,"slug"?: string | null,"sort"?: number | null,"updated_at"?: string,"updated_by"?: string | null,"visible"?: boolean,"weeks"?: number | null
                  }
                  Update: {
                    "active"?: boolean,"code"?: string,"deleted_at"?: string | null,"for_whom"?: Json | null,"includes"?: NonNullable<Json>,"kind"?: Database["public"]['Enums']["pack_kind"],"name"?: NonNullable<Json>,"price"?: number,"pricing_version"?: string,"slug"?: string | null,"sort"?: number | null,"updated_at"?: string,"updated_by"?: string | null,"visible"?: boolean,"weeks"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"pricing_price_history": {
                  Row: {
                    "changed_at": string,"changed_by": string | null,"id": number,"item_code": string,"item_kind": Database["public"]['Enums']["pricing_item"],"new_price": number,"note": string | null,"old_price": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "changed_at"?: string,"changed_by"?: string | null,"id"?: never,"item_code": string,"item_kind": Database["public"]['Enums']["pricing_item"],"new_price": number,"note"?: string | null,"old_price"?: number | null
                  }
                  Update: {
                    "changed_at"?: string,"changed_by"?: string | null,"id"?: never,"item_code"?: string,"item_kind"?: Database["public"]['Enums']["pricing_item"],"new_price"?: number,"note"?: string | null,"old_price"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"pricing_settings": {
                  Row: {
                    "affiliate": NonNullable<Json>,"feature": number,"hourly": number,"id": boolean,"pricing_version": string,"published_at": string | null,"published_hash": string | null,"published_snapshot": Json | null,"updated_at": string,"updated_by": string | null,"upgrade_rule": string
                  }
                  ComputedFields: never
                  Insert: {
                    "affiliate": NonNullable<Json>,"feature": number,"hourly": number,"id"?: boolean,"pricing_version": string,"published_at"?: string | null,"published_hash"?: string | null,"published_snapshot"?: Json | null,"updated_at"?: string,"updated_by"?: string | null,"upgrade_rule"?: string
                  }
                  Update: {
                    "affiliate"?: NonNullable<Json>,"feature"?: number,"hourly"?: number,"id"?: boolean,"pricing_version"?: string,"published_at"?: string | null,"published_hash"?: string | null,"published_snapshot"?: Json | null,"updated_at"?: string,"updated_by"?: string | null,"upgrade_rule"?: string
                  }
                  Relationships: [
                    
                  ]
                },"site_content_entries": {
                  Row: {
                    "created_at": string,"draft": Json | null,"draft_updated_at": string | null,"draft_updated_by": string | null,"id": string,"key": string,"kind": Database["public"]['Enums']["content_kind"],"locale": Database["public"]['Enums']["locale"] | null,"published": Json | null,"published_at": string | null,"published_by": string | null,"published_version": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"draft"?: Json | null,"draft_updated_at"?: string | null,"draft_updated_by"?: string | null,"id"?: string,"key": string,"kind": Database["public"]['Enums']["content_kind"],"locale"?: Database["public"]['Enums']["locale"] | null,"published"?: Json | null,"published_at"?: string | null,"published_by"?: string | null,"published_version"?: number,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"draft"?: Json | null,"draft_updated_at"?: string | null,"draft_updated_by"?: string | null,"id"?: string,"key"?: string,"kind"?: Database["public"]['Enums']["content_kind"],"locale"?: Database["public"]['Enums']["locale"] | null,"published"?: Json | null,"published_at"?: string | null,"published_by"?: string | null,"published_version"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"site_content_publications": {
                  Row: {
                    "commit_sha": string | null,"committed_at": string | null,"created_at": string,"created_by": string | null,"deployed_at": string | null,"error": string | null,"files": Json | null,"id": string,"snapshot": NonNullable<Json>,"status": Database["public"]['Enums']["publication_status"],"workflow_run_id": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "commit_sha"?: string | null,"committed_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"deployed_at"?: string | null,"error"?: string | null,"files"?: Json | null,"id"?: string,"snapshot": NonNullable<Json>,"status"?: Database["public"]['Enums']["publication_status"],"workflow_run_id"?: number | null
                  }
                  Update: {
                    "commit_sha"?: string | null,"committed_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"deployed_at"?: string | null,"error"?: string | null,"files"?: Json | null,"id"?: string,"snapshot"?: NonNullable<Json>,"status"?: Database["public"]['Enums']["publication_status"],"workflow_run_id"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"site_content_versions": {
                  Row: {
                    "content": NonNullable<Json>,"entry_id": string,"id": string,"publication_id": string | null,"published_at": string,"published_by": string | null,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "content": NonNullable<Json>,"entry_id": string,"id"?: string,"publication_id"?: string | null,"published_at"?: string,"published_by"?: string | null,"version": number
                  }
                  Update: {
                    "content"?: NonNullable<Json>,"entry_id"?: string,"id"?: string,"publication_id"?: string | null,"published_at"?: string,"published_by"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "site_content_versions_entry_id_fkey"
      columns: ["entry_id"]
isOneToOne: false
      referencedRelation: "site_content_entries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "site_content_versions_publication_id_fkey"
      columns: ["publication_id"]
isOneToOne: false
      referencedRelation: "site_content_publications"
      referencedColumns: ["id"]
    }
                  ]
                },"staff_invites": {
                  Row: {
                    "claimed_at": string | null,"claimed_user_id": string | null,"commission_rate": number,"created_at": string,"email": string,"expires_at": string,"id": string,"invited_by": string | null,"role": Database["public"]['Enums']["staff_role"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "claimed_at"?: string | null,"claimed_user_id"?: string | null,"commission_rate": number,"created_at"?: string,"email": string,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"role": Database["public"]['Enums']["staff_role"],"updated_at"?: string
                  }
                  Update: {
                    "claimed_at"?: string | null,"claimed_user_id"?: string | null,"commission_rate"?: number,"created_at"?: string,"email"?: string,"expires_at"?: string,"id"?: string,"invited_by"?: string | null,"role"?: Database["public"]['Enums']["staff_role"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"staff_members": {
                  Row: {
                    "commission_rate": number,"created_at": string,"disabled_at": string | null,"display_name": string | null,"invited_by": string | null,"notes": string | null,"role": Database["public"]['Enums']["staff_role"],"telegram_chat_id": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "commission_rate"?: number,"created_at"?: string,"disabled_at"?: string | null,"display_name"?: string | null,"invited_by"?: string | null,"notes"?: string | null,"role"?: Database["public"]['Enums']["staff_role"],"telegram_chat_id"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "commission_rate"?: number,"created_at"?: string,"disabled_at"?: string | null,"display_name"?: string | null,"invited_by"?: string | null,"notes"?: string | null,"role"?: Database["public"]['Enums']["staff_role"],"telegram_chat_id"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"staff_telegram_codes": {
                  Row: {
                    "code": string,"expires_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"expires_at": string,"user_id": string
                  }
                  Update: {
                    "code"?: string,"expires_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "staff_telegram_codes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "staff_members"
      referencedColumns: ["user_id"]
    }
                  ]
                },"upgrade_requests": {
                  Row: {
                    "admin_note": string | null,"client_id": string,"computed_price": number,"created_at": string,"extras": (string)[],"from_pack_code": string | null,"id": string,"pricing_version": string,"status": Database["public"]['Enums']["upgrade_status"],"to_pack_code": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_note"?: string | null,"client_id": string,"computed_price": number,"created_at"?: string,"extras"?: (string)[],"from_pack_code"?: string | null,"id"?: string,"pricing_version": string,"status"?: Database["public"]['Enums']["upgrade_status"],"to_pack_code"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "admin_note"?: string | null,"client_id"?: string,"computed_price"?: number,"created_at"?: string,"extras"?: (string)[],"from_pack_code"?: string | null,"id"?: string,"pricing_version"?: string,"status"?: Database["public"]['Enums']["upgrade_status"],"to_pack_code"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "upgrade_requests_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "upgrade_requests_from_pack_code_fkey"
      columns: ["from_pack_code"]
isOneToOne: false
      referencedRelation: "packs"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "upgrade_requests_to_pack_code_fkey"
      columns: ["to_pack_code"]
isOneToOne: false
      referencedRelation: "packs"
      referencedColumns: ["code"]
    }
                  ]
                },"user_profiles": {
                  Row: {
                    "created_at": string,"display_name": string | null,"first_audience": Database["public"]['Enums']["audience_signal"] | null,"first_audience_source": string | null,"locale": Database["public"]['Enums']["locale"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name"?: string | null,"first_audience"?: Database["public"]['Enums']["audience_signal"] | null,"first_audience_source"?: string | null,"locale"?: Database["public"]['Enums']["locale"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string | null,"first_audience"?: Database["public"]['Enums']["audience_signal"] | null,"first_audience_source"?: string | null,"locale"?: Database["public"]['Enums']["locale"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_user_story":
{ Args: { "p_create_task"?: boolean,"p_estimate_amount": number,"p_estimate_hours": number,"p_note": string,"p_story_id": string }; Returns: string
                           },
"admin_clients":
{ Args: { "p_client_id"?: string }; Returns: {
              "contact_id": string,
"created_at": string,
"delivered_at": string | null,
"id": string,
"invite_email": string | null,
"lead_id": string | null,
"notes_internal": string | null,
"pack_code": string,
"pack_option": string | null,
"project_phase": Database["public"]['Enums']["project_phase"],
"starts_at": string | null,
"updated_at": string,
"user_id": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "clients"
        isOneToOne: false
        isSetofReturn: true
      } },
"admin_close_lead_paid":
{ Args: { "p_amount": number,"p_commission"?: boolean,"p_generate_reward"?: boolean,"p_lead_id": string,"p_paid_at"?: string,"p_pricing_version"?: string,"p_reward_amount"?: number,"p_reward_percent"?: number,"p_reward_type"?: Database["public"]['Enums']["reward_type"] }; Returns: Json
                           },
"admin_commission_approve":
{ Args: { "p_id": string }; Returns: undefined
                           },
"admin_commission_create":
{ Args: { "p_base_amount": number,"p_closer_id": string,"p_lead_id": string,"p_note": string }; Returns: string
                           },
"admin_commission_mark_paid":
{ Args: { "p_id": string,"p_note": string,"p_paid_at": string }; Returns: undefined
                           },
"admin_commission_reject":
{ Args: { "p_id": string,"p_reason": string }; Returns: undefined
                           },
"admin_counters":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_import_conflict_resolve":
{ Args: { "p_id": string,"p_note"?: string,"p_resolution": Database["public"]['Enums']["conflict_resolution"] }; Returns: undefined
                           },
"admin_import_conflicts":
{ Args: { "p_status"?: Database["public"]['Enums']["conflict_status"] }; Returns: {
              "created_at": string,"existing_contact_id": string,"existing_display_name": string,"existing_kind": Database["public"]['Enums']["contact_kind"],"existing_owner_id": string,"existing_owner_name": string,"existing_status": string,"id": string,"import_id": string,"importer_name": string,"importer_user_id": string,"row": Json
            }[]
                           },
"admin_pricing_delete":
{ Args: { "p_code": string,"p_kind": Database["public"]['Enums']["pricing_item"] }; Returns: undefined
                           },
"admin_pricing_restore":
{ Args: { "p_code": string,"p_kind": Database["public"]['Enums']["pricing_item"] }; Returns: undefined
                           },
"admin_pricing_set_extra":
{ Args: { "p": Json }; Returns: string
                           },
"admin_pricing_set_option":
{ Args: { "p": Json,"p_pack_code": string }; Returns: undefined
                           },
"admin_pricing_set_pack":
{ Args: { "p": Json }; Returns: string
                           },
"admin_pricing_set_settings":
{ Args: { "p_feature": number,"p_hourly": number }; Returns: undefined
                           },
"admin_quote_set_discount":
{ Args: { "p_amount": number,"p_note": string,"p_quote_id": string }; Returns: undefined
                           },
"admin_reassign_contacts":
{ Args: { "p_from": string,"p_to": string }; Returns: number
                           },
"admin_staff_invite":
{ Args: { "p_commission_rate": number,"p_email": string,"p_role": Database["public"]['Enums']["staff_role"] }; Returns: string
                           },
"admin_staff_list":
{ Args: Record<PropertyKey, never>; Returns: {
              "commission_rate": number,"commissions_pending": number,"contacts_count": number,"disabled_at": string,"display_name": string,"email": string,"mfa_enrolled": boolean,"notes": string,"role": Database["public"]['Enums']["staff_role"],"telegram_linked": boolean,"user_id": string
            }[]
                           },
"admin_staff_set":
{ Args: { "p_commission_rate": number,"p_disabled": boolean,"p_notes": string,"p_user_id": string }; Returns: undefined
                           },
"affiliate_leads":
{ Args: Record<PropertyKey, never>; Returns: {
              "created_at": string,"lead_id": string,"pack_code": string,"reward_status": Database["public"]['Enums']["reward_status"],"status": Database["public"]['Enums']["lead_status"]
            }[]
                           },
"area_client":
{ Args: Record<PropertyKey, never>; Returns: {
              "created_at": string,"delivered_at": string,"id": string,"pack_code": string,"pack_option": string,"project_phase": Database["public"]['Enums']["project_phase"],"starts_at": string
            }[]
                           },
"area_lead_summary":
{ Args: Record<PropertyKey, never>; Returns: {
              "created_at": string,"pack_code": string,"pack_option": string,"price_from": number,"status": Database["public"]['Enums']["lead_status"]
            }[]
                           },
"chat_context_publish":
{ Args: { "p_id": string }; Returns: Json
                           },
"chat_context_published":
{ Args: { "p_case": Database["public"]['Enums']["chat_case"],"p_locale": Database["public"]['Enums']["locale"] }; Returns: Json
                           },
"chat_purge_anonymous":
{ Args: { "p_older_than": string }; Returns: number
                           },
"claim_client_access":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"claim_staff_access":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["staff_role"]
                           },
"content_draft_snapshot":
{ Args: { "p_locale": Database["public"]['Enums']["locale"] }; Returns: Json
                           },
"content_publication_mark":
{ Args: { "p_commit_sha": string,"p_error": string,"p_files": Json,"p_id": string,"p_run_id": number,"p_status": Database["public"]['Enums']["publication_status"] }; Returns: undefined
                           },
"content_publish":
{ Args: { "p_entry_ids"?: (string)[] }; Returns: string
                           },
"content_rollback":
{ Args: { "p_entry_id": string,"p_version": number }; Returns: string
                           },
"content_save_draft":
{ Args: { "p_draft": Json,"p_key": string,"p_kind": Database["public"]['Enums']["content_kind"],"p_locale": Database["public"]['Enums']["locale"] }; Returns: string
                           },
"convert_user_story":
{ Args: { "p_story_id": string }; Returns: string
                           },
"create_lead":
{ Args: { "p": Json }; Returns: {
              "contact_id": string,"created": boolean,"lead_id": string
            }[]
                           },
"crm_import_contacts_csv":
{ Args: { "p_checksum": string,"p_file_name": string,"p_rows": Json }; Returns: Json
                           },
"crm_import_organizations":
{ Args: { "p_rows": Json }; Returns: {
              "created": number,"updated": number
            }[]
                           },
"crm_my_counters":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"crm_request_close":
{ Args: { "p_lead_id": string }; Returns: undefined
                           },
"crm_team_counters":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"increment_quota":
{ Args: { "p_key": string,"p_limit": number,"p_ttl": string }; Returns: boolean
                           },
"invite_client_access":
{ Args: { "p_client_id": string,"p_email": string }; Returns: undefined
                           },
"notification_recipients":
{ Args: { "p_event": string,"p_owner_id": string }; Returns: {
              "address": string,"admin_fallback": boolean,"channel": Database["public"]['Enums']["notification_channel"]
            }[]
                           },
"outbox_ack":
{ Args: { "p_ids": (number)[],"p_worker": string }; Returns: number
                           },
"outbox_claim":
{ Args: { "p_limit": number,"p_worker": string }; Returns: {
              "attempts": number,"created_at": string,"event": string,"id": number,"payload": Json
            }[]
                           },
"outbox_fail":
{ Args: { "p_error": string,"p_id": number,"p_worker": string }; Returns: boolean
                           },
"pricing_catalog_snapshot":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"pricing_published":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"quote_add_item":
{ Args: { "p_extra_code": string,"p_quantity"?: number,"p_quote_id": string }; Returns: string
                           },
"quote_create":
{ Args: { "p_contact_id": string,"p_lead_id"?: string,"p_title": string }; Returns: string
                           },
"quote_decide":
{ Args: { "p_quote_id": string,"p_status": Database["public"]['Enums']["quote_status"] }; Returns: undefined
                           },
"quote_mark_sent":
{ Args: { "p_quote_id": string }; Returns: undefined
                           },
"quote_remove_item":
{ Args: { "p_item_id": string }; Returns: undefined
                           },
"quote_set_quantity":
{ Args: { "p_item_id": string,"p_quantity": number }; Returns: undefined
                           },
"reject_user_story":
{ Args: { "p_note": string,"p_story_id": string }; Returns: undefined
                           },
"request_upgrade":
{ Args: { "p_extras"?: (string)[],"p_to_pack_code": string }; Returns: string
                           },
"scheduled_jobs_disable":
{ Args: { "p_name": string,"p_reason": string }; Returns: undefined
                           },
"scheduled_jobs_due":
{ Args: { "p_now": string }; Returns: {
              "cron": string,"name": string,"next_run_at": string,"tz": string
            }[]
                           },
"scheduled_jobs_mark_ran":
{ Args: { "p_name": string,"p_next_run_at": string,"p_ran_at": string }; Returns: undefined
                           },
"staff_clients":
{ Args: { "p_client_id"?: string }; Returns: {
              "contact_id": string,"created_at": string,"delivered_at": string,"has_access": boolean,"id": string,"invite_email": string,"lead_id": string,"pack_code": string,"pack_option": string,"project_phase": Database["public"]['Enums']["project_phase"],"starts_at": string,"updated_at": string,"user_id": string
            }[]
                           },
"staff_commissions":
{ Args: Record<PropertyKey, never>; Returns: {
              "amount": number,"approved_at": string,"base_amount": number,"closed_at": string,"closer_disabled": boolean,"closer_id": string,"closer_name": string,"closer_rate": number,"contact_name": string,"id": string,"organization": string,"pack_code": string,"pack_option": string,"paid_at": string,"paid_note": string,"percent": number,"rejected_reason": string,"status": Database["public"]['Enums']["commission_status"]
            }[]
                           },
"staff_telegram_begin":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"staff_telegram_link":
{ Args: { "p_chat_id": string,"p_code": string }; Returns: boolean
                           },
"system_health":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"test_set_email_confirmed":
{ Args: { "p_confirmed": boolean,"p_email": string }; Returns: undefined
                           }
          }
          Enums: {
            "affiliate_level": "standard"|"premium","asset_source": "client"|"admin","audience_signal": "client"|"partner"|"recruiter"|"curious"|"referral"|"business"|"company"|"blog"|"neutral","chat_case": "client"|"partner"|"recruiter"|"curious","chat_message_type": "text"|"quick_contact"|"case_switch"|"system","chat_sender": "visitor"|"assistant"|"jose","client_extra_status": "included"|"requested"|"active"|"rejected","comment_status": "pending"|"approved"|"rejected","commission_status": "pending"|"approved"|"paid"|"rejected","conflict_resolution": "assign_existing"|"assign_importer"|"merge"|"discard","conflict_status": "pending"|"resolved","contact_kind": "lead"|"client"|"agency"|"recruiter"|"other","contact_source": "web_form"|"web_proposal"|"chat"|"calcom"|"partner_form"|"import_agencias"|"manual"|"radar"|"newsletter_interest"|"import_csv","contact_via": "client"|"partner"|"recruiter"|"other","content_kind": "message_override"|"faq"|"project"|"blog_post"|"settings","context_status": "draft"|"published"|"archived","draft_author": "ai"|"jose"|"closer","draft_status": "draft"|"copied"|"marked_sent"|"discarded","extra_billing": "one_off"|"monthly"|"yearly","import_status": "done"|"failed","interaction_actor": "jose"|"ai"|"system"|"contact"|"closer","interaction_channel": "linkedin_invite"|"linkedin_inmail"|"email"|"whatsapp"|"calcom"|"web_form"|"web_proposal"|"chat"|"other","interaction_direction": "out"|"in"|"internal","interaction_kind": "note"|"message_sent"|"message_received"|"meeting"|"call"|"chat_thread"|"status_change"|"import"|"lead_created"|"lead_won"|"lead_lost"|"client_invited"|"story_proposed"|"story_decided"|"commission","lead_source": "web_form"|"web_proposal"|"chat"|"calcom"|"partner_form"|"manual"|"referral","lead_status": "open"|"won"|"lost","locale": "es"|"en","notification_channel": "telegram"|"email","notification_recipient": "admin"|"owner"|"staff_user"|"client","org_kind": "agency"|"company"|"local_business"|"recruiter_firm"|"other","pack_kind": "web"|"app","pricing_item": "pack"|"pack_option"|"extra"|"settings","project_phase": "kickoff"|"design"|"build"|"review"|"delivered"|"maintenance","publication_status": "queued"|"committed"|"deployed"|"failed","quote_status": "draft"|"sent"|"accepted"|"rejected"|"expired","reward_status": "pending"|"paid","reward_type": "maintenance_months"|"percent","staff_role": "admin"|"closer","story_status": "proposed"|"accepted"|"rejected"|"converted","task_status": "pending"|"in_progress"|"done","thread_status": "open"|"handed_over"|"closed","upgrade_status": "pending"|"accepted"|"rejected"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "affiliate_level": ["standard", "premium"],"asset_source": ["client", "admin"],"audience_signal": ["client", "partner", "recruiter", "curious", "referral", "business", "company", "blog", "neutral"],"chat_case": ["client", "partner", "recruiter", "curious"],"chat_message_type": ["text", "quick_contact", "case_switch", "system"],"chat_sender": ["visitor", "assistant", "jose"],"client_extra_status": ["included", "requested", "active", "rejected"],"comment_status": ["pending", "approved", "rejected"],"commission_status": ["pending", "approved", "paid", "rejected"],"conflict_resolution": ["assign_existing", "assign_importer", "merge", "discard"],"conflict_status": ["pending", "resolved"],"contact_kind": ["lead", "client", "agency", "recruiter", "other"],"contact_source": ["web_form", "web_proposal", "chat", "calcom", "partner_form", "import_agencias", "manual", "radar", "newsletter_interest", "import_csv"],"contact_via": ["client", "partner", "recruiter", "other"],"content_kind": ["message_override", "faq", "project", "blog_post", "settings"],"context_status": ["draft", "published", "archived"],"draft_author": ["ai", "jose", "closer"],"draft_status": ["draft", "copied", "marked_sent", "discarded"],"extra_billing": ["one_off", "monthly", "yearly"],"import_status": ["done", "failed"],"interaction_actor": ["jose", "ai", "system", "contact", "closer"],"interaction_channel": ["linkedin_invite", "linkedin_inmail", "email", "whatsapp", "calcom", "web_form", "web_proposal", "chat", "other"],"interaction_direction": ["out", "in", "internal"],"interaction_kind": ["note", "message_sent", "message_received", "meeting", "call", "chat_thread", "status_change", "import", "lead_created", "lead_won", "lead_lost", "client_invited", "story_proposed", "story_decided", "commission"],"lead_source": ["web_form", "web_proposal", "chat", "calcom", "partner_form", "manual", "referral"],"lead_status": ["open", "won", "lost"],"locale": ["es", "en"],"notification_channel": ["telegram", "email"],"notification_recipient": ["admin", "owner", "staff_user", "client"],"org_kind": ["agency", "company", "local_business", "recruiter_firm", "other"],"pack_kind": ["web", "app"],"pricing_item": ["pack", "pack_option", "extra", "settings"],"project_phase": ["kickoff", "design", "build", "review", "delivered", "maintenance"],"publication_status": ["queued", "committed", "deployed", "failed"],"quote_status": ["draft", "sent", "accepted", "rejected", "expired"],"reward_status": ["pending", "paid"],"reward_type": ["maintenance_months", "percent"],"staff_role": ["admin", "closer"],"story_status": ["proposed", "accepted", "rejected", "converted"],"task_status": ["pending", "in_progress", "done"],"thread_status": ["open", "handed_over", "closed"],"upgrade_status": ["pending", "accepted", "rejected"]
          }
        }
} as const
