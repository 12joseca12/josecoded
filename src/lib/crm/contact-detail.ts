import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { ownerRowSchema } from "@/types/crm";
import {
  activityRowSchema,
  type ContactDetailResult,
  contactDetailSchema,
} from "@/types/crm-detail";
import type { Database } from "@/types/database";

export const activitiesLimit = 100;

const detailSelect =
  "id, full_name, organization, email, phone, kind, source, owner_id, next_action, next_action_at, last_activity_at, created_at, role_title, city, website, linkedin_url, tags, notes, deals(id, stage, via, amount, won_amount, won_at, lost_reason, lost_at, created_at, updated_at)";

const uuidSchema = z.uuid();
const activitiesSchema = z.array(activityRowSchema);
const peopleSchema = z.array(ownerRowSchema);

export async function fetchContactDetail(
  client: SupabaseClient<Database>,
  id: string,
): Promise<ContactDetailResult> {
  if (!uuidSchema.safeParse(id).success) return { status: "missing" };
  try {
    const [contact, activities, people] = await Promise.all([
      client
        .from("contacts")
        .select(detailSelect)
        .eq("id", id)
        .is("archived_at", null)
        .maybeSingle(),
      client
        .from("activities")
        .select("id, kind, body, occurred_at, author_id, deal_id")
        .eq("contact_id", id)
        .order("occurred_at", { ascending: false })
        .limit(activitiesLimit),
      client
        .from("profiles")
        .select("id, full_name, role, is_active")
        .in("role", ["admin", "closer"])
        .order("full_name"),
    ]);
    if (contact.error || activities.error || people.error) return { status: "error" };
    if (contact.data === null) return { status: "missing" };
    const parsedContact = contactDetailSchema.safeParse(contact.data);
    const parsedActivities = activitiesSchema.safeParse(activities.data);
    const parsedPeople = peopleSchema.safeParse(people.data);
    if (!parsedContact.success || !parsedActivities.success || !parsedPeople.success) {
      return { status: "error" };
    }
    return {
      status: "ok",
      contact: parsedContact.data,
      activities: parsedActivities.data,
      people: parsedPeople.data.map((person) => ({
        id: person.id,
        name: person.full_name,
        assignable: person.is_active,
      })),
    };
  } catch {
    return { status: "error" };
  }
}

export function formatDateTime(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(date);
}

export function formatMoney(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}
