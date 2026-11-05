import { percentOfCents } from "@/lib/money";
import type {
  CommissionPreview,
  OwnerRates,
  PreviewLine,
  WinPreviewContext,
} from "@/types/deal-win";

function recurringRateOf(project: number, recurring: number | null): number | null {
  return recurring !== null && recurring < project ? recurring : null;
}

function lineFor(
  beneficiary: { id: string; name: string | null },
  role: PreviewLine["role"],
  rate: number | null,
  recurring: number | null,
  wonCents: number,
  recurringCents: number | null,
): PreviewLine | null {
  const project = rate ?? 0;
  if (project <= 0) return null;
  const recurringRate = recurringRateOf(project, recurring);
  return {
    beneficiaryId: beneficiary.id,
    beneficiaryName: beneficiary.name,
    role,
    rate: project,
    amountCents: percentOfCents(wonCents, project),
    recurringRate,
    recurringMonthlyCents:
      recurringRate !== null && recurringCents !== null
        ? percentOfCents(recurringCents, recurringRate)
        : null,
  };
}

export function previewCommission(
  context: WinPreviewContext,
  wonCents: number,
  recurringCents: number | null,
): CommissionPreview {
  if (context.via === "hiring") return { status: "none", reason: "hiring" };
  if (context.ownerId === null) return { status: "none", reason: "unknown_owner" };
  const owner: OwnerRates | undefined = context.people.find(
    (person) => person.id === context.ownerId,
  );
  if (!owner) return { status: "none", reason: "unknown_owner" };
  if (owner.role !== "closer") return { status: "none", reason: "admin" };

  const own = lineFor(
    { id: owner.id, name: owner.full_name },
    "closer",
    owner.closer_rate,
    owner.closer_recurring_rate,
    wonCents,
    recurringCents,
  );
  const parentId = owner.parent_closer_id;
  const parent =
    parentId === null
      ? null
      : lineFor(
          {
            id: parentId,
            name: context.people.find((person) => person.id === parentId)?.full_name ?? null,
          },
          "parent",
          owner.parent_rate,
          owner.parent_recurring_rate,
          wonCents,
          recurringCents,
        );

  const lines = [own, parent].filter((line): line is PreviewLine => line !== null);
  if (lines.length === 0) return { status: "none", reason: "no_rate" };
  return {
    status: "ok",
    lines,
    totalCents: lines.reduce((sum, line) => sum + line.amountCents, 0),
  };
}
