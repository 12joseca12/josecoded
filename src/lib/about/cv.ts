import { profileLinks } from "@/config/profiles";
import { type Cv, isPending, type StackGroup, type StackLevel } from "@/content/schemas";

export interface StackItemView {
  name: string;
  years: number | null;
  level: StackLevel | null;
}

export interface StackGroupView {
  group: StackGroup;
  items: StackItemView[];
}

export interface TimelineEntryView {
  period: string | null;
  title: string;
  organization: string | null;
  summary: string | null;
  highlights: string[];
}

export interface ProfileLinkView {
  id: "linkedin" | "github" | "malt";
  href: string;
}

const profileOrder = ["linkedin", "github", "malt"] as const;

export function resolveStack(stack: Cv["stack"]): StackGroupView[] {
  return stack.map((entry) => ({
    group: entry.group,
    items: entry.items.map((item) => ({
      name: item.name,
      years: typeof item.years === "number" ? item.years : null,
      level: item.level === undefined || isPending(item.level) ? null : (item.level as StackLevel),
    })),
  }));
}

export function resolveExperience(experience: Cv["experience"]): TimelineEntryView[] {
  return experience
    .filter((entry) => !Object.values(entry).some(isPending))
    .map((entry) => ({
      period: entry.period,
      title: entry.role,
      organization: entry.organization,
      summary: entry.summary,
      highlights: entry.highlights,
    }));
}

export function resolveEducation(education: Cv["education"]): TimelineEntryView[] {
  return education
    .filter((entry) => !Object.values(entry).some(isPending))
    .map((entry) => ({
      period: entry.period ?? null,
      title: entry.title,
      organization: entry.organization ?? null,
      summary: null,
      highlights: [],
    }));
}

export function resolveCvHref(
  file: Cv["file"],
  locale: keyof Cv["file"],
  enabled = true,
): string | null {
  const href = file[locale];
  return enabled && !isPending(href) ? href : null;
}

export function resolveProfileLinks(
  links: Readonly<Record<string, string>> = profileLinks,
): ProfileLinkView[] {
  return profileOrder.flatMap((id) => {
    const href = links[id];
    return href !== undefined && !href.includes("{{DATO") ? [{ id, href }] : [];
  });
}

export function yearsLabel(years: number, one: string, many: string): string {
  return (years === 1 ? one : many).replace("{n}", String(years));
}
