"use client";

import { useRouter } from "next/navigation";
import { type SyntheticEvent, useState, useTransition } from "react";

import { Button } from "@/components/ui/Button/Button";
import { Checkbox } from "@/components/ui/Checkbox/Checkbox";
import { Field } from "@/components/ui/Field/Field";
import { Sheet } from "@/components/ui/Sheet/Sheet";
import {
  type TaskOption,
  updateBodyMax,
  type UpdateFormHandler,
  type UpdateFormLabels,
  type UpdateResult,
} from "@/types/project-updates";

import styles from "./UpdateForm.module.css";

interface UpdateFormProps {
  projectId: string;
  tasks: TaskOption[];
  labels: UpdateFormLabels;
  save: UpdateFormHandler;
}

interface Problem {
  field: "body" | "taskId" | null;
  text: string;
}

function problemOf(result: UpdateResult, labels: UpdateFormLabels): Problem | null {
  if (result.status === "invalid")
    return { field: result.field, text: labels.errors[result.field] };
  if (result.status === "error") return { field: null, text: labels.errors[result.code] };
  return null;
}

export function UpdateForm({ projectId, tasks, labels, save }: UpdateFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [taskId, setTaskId] = useState("");
  const [visible, setVisible] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [pending, startTransition] = useTransition();

  const close = () => {
    setOpen(false);
    setProblem(null);
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setProblem(null);
    startTransition(async () => {
      let result: UpdateResult;
      try {
        result = await save({
          projectId,
          body,
          taskId,
          visibility: visible ? "client" : "internal",
        });
      } catch {
        result = { status: "error", code: "error" };
      }
      if (result.status === "done") {
        setBody("");
        setTaskId("");
        setVisible(false);
        setOpen(false);
        router.refresh();
        return;
      }
      setProblem(problemOf(result, labels));
    });
  };

  return (
    <>
      <Button
        variant="light"
        size="sm"
        onClick={() => {
          setOpen(true);
        }}
      >
        {labels.open}
      </Button>
      <Sheet open={open} onClose={close} title={labels.title} closeLabel={labels.close}>
        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <Field
            control="textarea"
            name="body"
            label={labels.body}
            hint={labels.bodyHint}
            value={body}
            maxLength={updateBodyMax}
            rows={5}
            onChange={(event) => {
              setBody(event.currentTarget.value);
            }}
            error={problem?.field === "body" ? problem.text : undefined}
            disabled={pending}
          />
          <Field
            control="select"
            name="taskId"
            label={labels.task}
            value={taskId}
            onChange={(event) => {
              setTaskId(event.currentTarget.value);
            }}
            error={problem?.field === "taskId" ? problem.text : undefined}
            disabled={pending}
          >
            <option value="">{labels.noTask}</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </Field>
          <Checkbox
            name="visible"
            checked={visible}
            disabled={pending}
            onChange={(event) => {
              setVisible(event.currentTarget.checked);
            }}
          >
            {labels.visible}
          </Checkbox>
          <p className={styles.hint}>{labels.visibleHint}</p>
          <p className={styles.feedback} role="alert">
            {problem !== null && problem.field === null ? problem.text : null}
          </p>
          <div className={styles.actions}>
            <Button
              type="submit"
              variant="light"
              loading={pending}
              loadingLabel={labels.submitting}
            >
              {labels.submit}
            </Button>
          </div>
        </form>
      </Sheet>
    </>
  );
}
