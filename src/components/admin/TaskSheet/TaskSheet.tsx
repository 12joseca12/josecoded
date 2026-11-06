"use client";

import { type SyntheticEvent, useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Field } from "@/components/ui/Field/Field";
import { Sheet } from "@/components/ui/Sheet/Sheet";
import {
  type Assignee,
  taskDescriptionMax,
  type TaskField,
  type TaskHandler,
  type TaskResult,
  type TaskRow,
  type TaskSheetLabels,
  taskStatuses,
} from "@/types/admin-project-detail";
import { type ProjectPhase, projectPhases } from "@/types/admin-projects";

import styles from "./TaskSheet.module.css";

interface TaskSheetProps {
  projectId: string;
  task?: TaskRow;
  defaultPhase: ProjectPhase;
  assignees: Assignee[];
  labels: TaskSheetLabels;
  save: TaskHandler;
  remove: TaskHandler;
}

interface Values {
  title: string;
  description: string;
  phase: ProjectPhase;
  status: string;
  assigneeId: string;
}

function valuesOf(task: TaskRow | undefined, phase: ProjectPhase): Values {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    phase: task?.phase ?? phase,
    status: task?.status ?? "todo",
    assigneeId: task?.assignee_id ?? "",
  };
}

interface Problem {
  field: TaskField | null;
  text: string;
}

function problemOf(result: TaskResult, labels: TaskSheetLabels): Problem | null {
  if (result.status === "invalid") {
    return { field: result.field, text: labels.errors[result.field] };
  }
  if (result.status === "error") {
    const field = result.code === "invalid_assignee" ? "assigneeId" : null;
    return { field, text: labels.errors[result.code] };
  }
  return null;
}

export function TaskSheet({
  projectId,
  task,
  defaultPhase,
  assignees,
  labels,
  save,
  remove,
}: TaskSheetProps) {
  const creating = task === undefined;
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Values>(() => valuesOf(task, defaultPhase));
  const [problem, setProblem] = useState<Problem | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!pending && problem?.field) {
      form.current?.querySelector<HTMLElement>(`[name="${problem.field}"]`)?.focus();
    }
  }, [problem, pending]);

  const set =
    (name: keyof Values) =>
    (event: SyntheticEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = event.currentTarget.value;
      setSaved(false);
      setValues((current) => ({ ...current, [name]: value }));
    };

  const openSheet = () => {
    if (!creating) setValues(valuesOf(task, defaultPhase));
    setSaved(false);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setProblem(null);
    setConfirming(false);
    if (creating) {
      setValues(valuesOf(undefined, defaultPhase));
      setSaved(false);
    }
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setProblem(null);
    setSaved(false);
    startTransition(async () => {
      const result = await save({
        id: task?.id ?? "",
        projectId,
        storyId: task?.story_id ?? "",
        ...values,
      });
      if (result.status === "done") {
        setSaved(true);
        if (creating) setValues(valuesOf(undefined, defaultPhase));
        return;
      }
      setProblem(problemOf(result, labels));
    });
  };

  const onDelete = () => {
    if (pending || task === undefined) return;
    setProblem(null);
    startTransition(async () => {
      const result = await remove({ id: task.id });
      if (result.status === "done") {
        close();
        return;
      }
      setConfirming(false);
      setProblem(problemOf(result, labels));
    });
  };

  const errorOf = (field: TaskField) => (problem?.field === field ? problem.text : undefined);
  const generalError = problem !== null && problem.field === null ? problem.text : null;
  const canDelete = task?.status === "todo" && task.story_id === null;

  return (
    <>
      {creating ? (
        <Button variant="light" size="sm" onClick={openSheet}>
          {labels.create}
        </Button>
      ) : (
        <Button
          variant="quiet"
          size="sm"
          aria-label={labels.editFor.replace("{title}", task.title)}
          onClick={openSheet}
        >
          {labels.edit}
        </Button>
      )}
      <Sheet
        open={open}
        onClose={close}
        title={creating ? labels.createTitle : labels.editTitle}
        closeLabel={labels.close}
      >
        <form className={styles.form} onSubmit={onSubmit} ref={form} noValidate>
          <Field
            name="title"
            label={labels.title}
            autoComplete="off"
            value={values.title}
            onChange={set("title")}
            error={errorOf("title")}
            disabled={pending}
            required
          />
          <Field
            control="textarea"
            name="description"
            label={labels.description}
            optionalLabel={labels.optional}
            rows={4}
            maxLength={taskDescriptionMax}
            value={values.description}
            onChange={set("description")}
            error={errorOf("description")}
            disabled={pending}
          />
          <div className={styles.grid}>
            <Field
              control="select"
              name="phase"
              label={labels.phase}
              value={values.phase}
              onChange={set("phase")}
              error={errorOf("phase")}
              disabled={pending}
            >
              {projectPhases.map((phase) => (
                <option key={phase} value={phase}>
                  {labels.phases[phase]}
                </option>
              ))}
            </Field>
            <Field
              control="select"
              name="status"
              label={labels.status}
              value={values.status}
              onChange={set("status")}
              error={errorOf("status")}
              disabled={pending}
            >
              {taskStatuses.map((status) => (
                <option key={status} value={status}>
                  {labels.statuses[status]}
                </option>
              ))}
            </Field>
          </div>
          <Field
            control="select"
            name="assigneeId"
            label={labels.assignee}
            value={values.assigneeId}
            onChange={set("assigneeId")}
            error={errorOf("assigneeId")}
            disabled={pending}
          >
            <option value="">{labels.assigneeNone}</option>
            {assignees.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </Field>
          <div className={styles.actions}>
            <Button
              type="submit"
              variant="light"
              loading={pending}
              loadingLabel={labels.submitting}
            >
              {creating ? labels.submitCreate : labels.submitEdit}
            </Button>
            {canDelete && !confirming ? (
              <Button
                variant="quiet"
                disabled={pending}
                onClick={() => {
                  setConfirming(true);
                }}
              >
                {labels.delete}
              </Button>
            ) : null}
          </div>
          {canDelete && confirming ? (
            <div className={styles.confirm} role="group" aria-label={labels.delete}>
              <p className={styles.text}>{labels.deleteConfirm}</p>
              <div className={styles.actions}>
                <Button
                  variant="light"
                  loading={pending}
                  loadingLabel={labels.deleting}
                  onClick={onDelete}
                >
                  {labels.delete}
                </Button>
                <Button
                  variant="quiet"
                  disabled={pending}
                  onClick={() => {
                    setConfirming(false);
                  }}
                >
                  {labels.cancel}
                </Button>
              </div>
            </div>
          ) : null}
          <p
            className={styles.feedback}
            data-tone={generalError ? "error" : "success"}
            role={generalError ? "alert" : "status"}
          >
            {generalError ?? (saved ? labels.done : null)}
          </p>
        </form>
      </Sheet>
    </>
  );
}
