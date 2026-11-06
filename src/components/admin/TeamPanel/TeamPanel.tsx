"use client";

import { type ReactNode, useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import type { TeamHandler, TeamPanelLabels, TeamResult } from "@/types/admin-project-team";

import styles from "./TeamPanel.module.css";

interface Person {
  id: string;
  name: string;
}

interface TeamPanelProps {
  projectId: string;
  clientId: string | null;
  clientName: string | null;
  freelanceId: string | null;
  clients: Person[];
  freelances: Person[];
  archived: boolean;
  labels: TeamPanelLabels;
  handlers: { setClient: TeamHandler; setFreelance: TeamHandler };
  invite: ReactNode;
}

export function TeamPanel({
  projectId,
  clientId,
  clientName,
  freelanceId,
  clients,
  freelances,
  archived,
  labels,
  handlers,
  invite,
}: TeamPanelProps) {
  const announce = useAnnounce();
  const [pending, startTransition] = useTransition();
  const [pick, setPick] = useState("");
  const [freelance, setFreelance] = useState(freelanceId ?? "");
  const [error, setError] = useState<string | null>(null);
  const candidates = clients.filter((person) => person.id !== clientId);

  const run = (call: () => Promise<TeamResult>, success: string, after?: () => void) => {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const result = await call();
      if (result.status === "done") {
        announce(success);
        after?.();
      } else {
        setError(result.status === "error" ? labels.errors[result.code] : labels.errors.error);
      }
    });
  };

  return (
    <div className={styles.panel}>
      <section className={styles.section} aria-labelledby="team-client">
        <h3 className={styles.title} id="team-client">
          {labels.client.title}
        </h3>
        <p className={styles.value}>{clientName ?? labels.client.none}</p>
        {clientId === null ? <p className={styles.help}>{labels.client.noneHelp}</p> : null}
        {clientId === null && !archived ? <div className={styles.row}>{invite}</div> : null}
        {archived ? null : candidates.length > 0 ? (
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              if (pick === "") return;
              run(
                () => handlers.setClient({ projectId, userId: pick }),
                labels.client.assigned,
                () => {
                  setPick("");
                },
              );
            }}
          >
            <Field
              control="select"
              name="client"
              label={labels.client.assign}
              value={pick}
              onChange={(event) => {
                setPick(event.currentTarget.value);
              }}
              disabled={pending}
            >
              <option value="">{labels.client.assignPlaceholder}</option>
              {candidates.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Field>
            <div className={styles.row}>
              <Button
                type="submit"
                variant="light"
                disabled={pick === ""}
                loading={pending}
                loadingLabel={labels.client.assigning}
              >
                {labels.client.assignSubmit}
              </Button>
            </div>
          </form>
        ) : (
          <p className={styles.help}>{labels.client.noCandidates}</p>
        )}
      </section>
      <section className={styles.section} aria-labelledby="team-freelance">
        <h3 className={styles.title} id="team-freelance">
          {labels.freelance.title}
        </h3>
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            run(
              () => handlers.setFreelance({ projectId, userId: freelance }),
              labels.freelance.saved,
            );
          }}
        >
          <Field
            control="select"
            name="freelance"
            label={labels.freelance.field}
            value={freelance}
            onChange={(event) => {
              setFreelance(event.currentTarget.value);
            }}
            disabled={pending || archived}
          >
            <option value="">{labels.freelance.none}</option>
            {freelances.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </Field>
          <div className={styles.row}>
            <Button
              type="submit"
              variant="light"
              disabled={archived || freelance === (freelanceId ?? "")}
              loading={pending}
              loadingLabel={labels.freelance.submitting}
            >
              {labels.freelance.submit}
            </Button>
          </div>
        </form>
      </section>
      <p className={styles.feedback} role="alert">
        {error}
      </p>
    </div>
  );
}
