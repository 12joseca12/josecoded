"use client";

import { type SyntheticEvent, useId, useState, useTransition } from "react";

import { ConfirmAction } from "@/components/admin/ConfirmAction/ConfirmAction";
import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import type {
  MemberCandidate,
  MemberListLabels,
  MemberRole,
  RoomActionResult,
  RoomMember,
} from "@/types/room";

import styles from "./MemberList.module.css";

interface MemberListProps {
  members: RoomMember[];
  headingLevel?: 2 | 3;
  labels: MemberListLabels;
  editor?: {
    candidates: MemberCandidate[];
    onAdd: (userId: string, role: MemberRole) => Promise<RoomActionResult>;
    onRemove: (userId: string) => Promise<RoomActionResult>;
    onChanged: () => void;
  };
}

export function MemberList({ members, headingLevel = 2, labels, editor }: MemberListProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const id = useId();
  const announce = useAnnounce();
  const [choice, setChoice] = useState("");
  const [problem, setProblem] = useState("");
  const [adding, startAdding] = useTransition();

  const active = members.filter((member) => member.left_at === null);
  const taken = new Set(active.map((member) => member.user_id));
  const options = editor
    ? editor.candidates.filter((candidate) => !taken.has(candidate.userId))
    : [];

  const onAdd = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const candidate = options.find((option) => option.userId === choice);
    if (!editor || !candidate || adding) return;
    setProblem("");
    startAdding(async () => {
      const result = await editor.onAdd(candidate.userId, candidate.role);
      if (result.status === "done") {
        setChoice("");
        announce(labels.added);
        editor.onChanged();
        return;
      }
      setProblem(labels.errors[result.code] ?? labels.errors.error ?? "");
    });
  };

  return (
    <section className={styles.members} aria-labelledby={`${id}-title`}>
      <Heading id={`${id}-title`} className={styles.title}>
        {labels.title}
      </Heading>
      {active.length === 0 ? (
        <p className={styles.empty}>{labels.empty}</p>
      ) : (
        <ul className={styles.list}>
          {active.map((member) => (
            <li key={member.user_id} className={styles.item}>
              <span className={styles.name}>{member.full_name}</span>
              <span className={styles.role}>{labels.roles[member.role]}</span>
              {editor && member.role !== "owner" ? (
                <ConfirmAction
                  triggerText={labels.remove}
                  triggerAria={labels.removeAria.replace("{name}", member.full_name)}
                  title={labels.confirmTitle}
                  text={labels.confirmText.replace("{name}", member.full_name)}
                  submitLabel={labels.confirmSubmit}
                  savingLabel={labels.saving}
                  closeLabel={labels.close}
                  doneMessage={labels.removed}
                  errors={labels.errors}
                  run={async () => {
                    const result = await editor.onRemove(member.user_id);
                    if (result.status === "done") editor.onChanged();
                    return result;
                  }}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {editor && options.length > 0 ? (
        <form className={styles.add} onSubmit={onAdd}>
          <label htmlFor={`${id}-who`} className={styles.addLabel}>
            {labels.addSelect}
          </label>
          <div className={styles.addRow}>
            <select
              id={`${id}-who`}
              className={styles.select}
              value={choice}
              onChange={(event) => {
                setChoice(event.target.value);
              }}
            >
              <option value="">{labels.addPlaceholder}</option>
              {options.map((option) => (
                <option key={option.userId} value={option.userId}>
                  {option.name}
                </option>
              ))}
            </select>
            <Button
              type="submit"
              variant="light"
              size="sm"
              disabled={choice === ""}
              loading={adding}
              loadingLabel={labels.adding}
            >
              {labels.addButton}
            </Button>
          </div>
          <p className={styles.error} role="alert" hidden={problem === ""}>
            {problem}
          </p>
        </form>
      ) : null}
    </section>
  );
}
