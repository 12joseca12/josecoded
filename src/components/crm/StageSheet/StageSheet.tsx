"use client";

import { type SyntheticEvent, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup/ChoiceGroup";
import { Field } from "@/components/ui/Field/Field";
import { ModalSheet } from "@/components/ui/ModalSheet/ModalSheet";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";
import { useMountedOnceOpen } from "@/lib/use-mounted-once-open";
import {
  type ChangeStageHandler,
  type ChangeStageResult,
  lostReasonMax,
  type ReachableStage,
  reachableStages,
  type StageSheetLabels,
} from "@/types/crm";

import form from "../sheet-form.module.css";

interface StageSheetProps {
  dealId: string;
  stage: string;
  updatedAt: string;
  labels: StageSheetLabels;
  change: ChangeStageHandler;
  triggerText: string;
  triggerAria: string;
  initialStage?: ReachableStage;
  triggerVariant?: "quiet" | "light";
}

type Problem = { field: "stage" | "reason" | null; text: string } | null;

function problemOf(result: ChangeStageResult, labels: StageSheetLabels): Problem {
  if (result.status === "done") return null;
  if (result.status === "invalid")
    return { field: result.field, text: labels.errors[result.field] };
  return { field: null, text: labels.errors[result.status] };
}

function currentChoice(stage: string, initial: ReachableStage | undefined): ReachableStage {
  if (initial) return initial;
  return reachableStages.find((option) => option === stage) ?? "new";
}

export function StageSheet({
  dealId,
  stage,
  updatedAt,
  labels,
  change,
  triggerText,
  triggerAria,
  initialStage,
  triggerVariant = "quiet",
}: StageSheetProps) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const [chosen, setChosen] = useState<ReachableStage>(() => currentChoice(stage, initialStage));
  const [problem, setProblem] = useState<Problem>(null);
  const [announce, setAnnounce] = useState("");
  const [saving, startSaving] = useTransition();
  const mounted = useMountedOnceOpen(open);

  const onOpen = () => {
    setSession((value) => value + 1);
    setChosen(currentChoice(stage, initialStage));
    setProblem(null);
    setAnnounce("");
    setOpen(true);
  };

  const onChange = (event: SyntheticEvent<HTMLFormElement>) => {
    const value = new FormData(event.currentTarget).get("stage");
    const next = reachableStages.find((option) => option === value);
    if (next) setChosen(next);
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    const reason = data.get("reason");
    if (chosen === stage) {
      setOpen(false);
      return;
    }
    setProblem(null);
    startSaving(async () => {
      const result = await change({
        dealId,
        stage: chosen,
        reason: typeof reason === "string" ? reason : "",
        expectedUpdatedAt: updatedAt,
      });
      const next = problemOf(result, labels);
      setProblem(next);
      if (next === null) {
        setAnnounce(labels.done);
        setOpen(false);
      }
    });
  };

  const options = reachableStages.map((value) => ({ value, label: labels.stages[value] }));

  return (
    <>
      <Button variant={triggerVariant} size="sm" aria-label={triggerAria} onClick={onOpen}>
        {triggerText}
      </Button>
      <VisuallyHidden>
        <span role="status">{announce}</span>
      </VisuallyHidden>
      {mounted ? (
        <ModalSheet
          open={open}
          onClose={() => {
            setOpen(false);
          }}
          title={labels.title}
          closeLabel={labels.close}
        >
          <form
            key={session}
            className={form.form}
            onSubmit={onSubmit}
            onChange={onChange}
            noValidate
          >
            <ChoiceGroup
              name="stage"
              legend={labels.stageLegend}
              options={options}
              defaultValue={chosen}
              error={problem?.field === "stage" ? problem.text : undefined}
            />
            {chosen === "lost" ? (
              <Field
                control="textarea"
                name="reason"
                label={labels.reasonLabel}
                maxLength={lostReasonMax}
                rows={3}
                error={problem?.field === "reason" ? problem.text : undefined}
              />
            ) : null}
            <p
              className={form.feedback}
              data-tone="error"
              role="alert"
              hidden={problem?.field !== null}
            >
              {problem?.field === null ? problem.text : ""}
            </p>
            <div className={form.actions}>
              <Button type="submit" variant="primary" loading={saving} loadingLabel={labels.saving}>
                {labels.submit}
              </Button>
            </div>
          </form>
        </ModalSheet>
      ) : null}
    </>
  );
}
