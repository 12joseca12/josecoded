"use client";

import { type SyntheticEvent, useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { ModalSheet } from "@/components/ui/ModalSheet/ModalSheet";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";
import type { ReassignHandler, ReassignLabels, ReassignResult } from "@/types/crm-detail";

import form from "../sheet-form.module.css";

interface Owner {
  id: string;
  name: string;
}

interface ReassignSheetProps {
  contactId: string;
  currentOwnerId: string | null;
  owners: Owner[];
  labels: ReassignLabels;
  reassign: ReassignHandler;
}

function problemOf(result: ReassignResult, labels: ReassignLabels): string {
  if (result.status === "done") return "";
  if (result.status === "invalid") return labels.errors.owner;
  return labels.errors[result.status];
}

export function ReassignSheet({
  contactId,
  currentOwnerId,
  owners,
  labels,
  reassign,
}: ReassignSheetProps) {
  const selectId = useId();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const [problem, setProblem] = useState("");
  const [announce, setAnnounce] = useState("");
  const [saving, startSaving] = useTransition();

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const value = new FormData(event.currentTarget).get("ownerId");
    const ownerId = typeof value === "string" ? value : "";
    if (ownerId === "" || ownerId === currentOwnerId) {
      setProblem(labels.errors.owner);
      return;
    }
    setProblem("");
    startSaving(async () => {
      const result = await reassign({ contactId, ownerId });
      const next = problemOf(result, labels);
      setProblem(next);
      if (next === "") {
        setAnnounce(labels.done);
        setOpen(false);
      }
    });
  };

  return (
    <>
      <Button
        variant="light"
        data-only="admin"
        onClick={() => {
          setSession((value) => value + 1);
          setProblem("");
          setAnnounce("");
          setOpen(true);
        }}
      >
        {labels.open}
      </Button>
      <VisuallyHidden>
        <span role="status">{announce}</span>
      </VisuallyHidden>
      <ModalSheet
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        title={labels.title}
        closeLabel={labels.close}
      >
        <form key={session} className={form.form} onSubmit={onSubmit} noValidate>
          <p>{labels.note}</p>
          <div className={form.field}>
            <label htmlFor={selectId} className={form.label}>
              {labels.owner}
            </label>
            <select
              id={selectId}
              name="ownerId"
              className={form.select}
              defaultValue=""
              aria-invalid={problem === "" ? undefined : true}
            >
              <option value="">{labels.placeholder}</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id} disabled={owner.id === currentOwnerId}>
                  {owner.name}
                </option>
              ))}
            </select>
          </div>
          <p className={form.feedback} data-tone="error" role="alert" hidden={problem === ""}>
            {problem}
          </p>
          <div className={form.actions}>
            <Button type="submit" variant="primary" loading={saving} loadingLabel={labels.saving}>
              {labels.submit}
            </Button>
          </div>
        </form>
      </ModalSheet>
    </>
  );
}
