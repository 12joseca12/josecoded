"use client";

import { type SyntheticEvent, useEffect, useRef, useState, useTransition } from "react";

import { useAnnounce } from "@/components/ui/Announcer/Announcer";
import { Button } from "@/components/ui/Button/Button";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { Field } from "@/components/ui/Field/Field";
import {
  type UpdateActionResult,
  updateBodyMax,
  type UpdateField,
  type UpdateFormLabels,
  type UpdateHandler,
} from "@/types/admin-project-updates";

import styles from "./UpdateForm.module.css";

interface UpdateFormProps {
  projectId: string;
  tasks: { id: string; title: string }[];
  labels: UpdateFormLabels;
  create: UpdateHandler;
}

interface Problem {
  field: UpdateField | null;
  text: string;
}

function problemOf(result: UpdateActionResult, labels: UpdateFormLabels): Problem | null {
  if (result.status === "invalid") {
    return { field: result.field, text: labels.errors[result.field] };
  }
  if (result.status === "error") {
    const field = result.code === "task_project_mismatch" ? "taskId" : null;
    return { field, text: labels.errors[result.code] };
  }
  return null;
}

export function UpdateForm({ projectId, tasks, labels, create }: UpdateFormProps) {
  const [body, setBody] = useState("");
  const [taskId, setTaskId] = useState("");
  const [visible, setVisible] = useState(true);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const announce = useAnnounce();

  useEffect(() => {
    if (!pending && problem?.field) {
      form.current?.querySelector<HTMLElement>(`[name="${problem.field}"]`)?.focus();
    }
  }, [problem, pending]);

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setProblem(null);
    startTransition(async () => {
      const result = await create({
        projectId,
        body,
        taskId,
        visibility: visible ? "client" : "internal",
      });
      if (result.status === "done") {
        announce(labels.done);
        setBody("");
        setTaskId("");
        return;
      }
      setProblem(problemOf(result, labels));
    });
  };

  const errorOf = (field: UpdateField) => (problem?.field === field ? problem.text : undefined);
  const generalError = problem !== null && problem.field === null ? problem.text : null;

  return (
    <form
      className={styles.form}
      onSubmit={onSubmit}
      ref={form}
      noValidate
      aria-label={labels.title}
    >
      <Field
        control="textarea"
        name="body"
        label={labels.body}
        rows={4}
        maxLength={updateBodyMax}
        value={body}
        onChange={(event) => {
          setBody(event.currentTarget.value);
        }}
        error={errorOf("body")}
        disabled={pending}
      />
      <Field
        control="select"
        name="taskId"
        label={labels.task}
        optionalLabel={labels.optional}
        value={taskId}
        onChange={(event) => {
          setTaskId(event.currentTarget.value);
        }}
        error={errorOf("taskId")}
        disabled={pending}
      >
        <option value="">{labels.taskNone}</option>
        {tasks.map((task) => (
          <option key={task.id} value={task.id}>
            {task.title}
          </option>
        ))}
      </Field>
      <Checkbox
        name="visible"
        checked={visible}
        onChange={(event) => {
          setVisible(event.currentTarget.checked);
        }}
        disabled={pending}
      >
        {labels.visible}
      </Checkbox>
      <p className={styles.locked}>{labels.visibleHint}</p>
      <div className={styles.actions}>
        <Button type="submit" variant="light" loading={pending} loadingLabel={labels.submitting}>
          {labels.submit}
        </Button>
      </div>
      <p className={styles.feedback} role="alert">
        {generalError}
      </p>
    </form>
  );
}
