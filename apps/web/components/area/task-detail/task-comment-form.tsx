'use client';

import { postTaskComment } from '@/app/[locale]/(area)/area-clientes/tareas/actions';
import { Field } from '@/components/forms/field';
import { Form } from '@/components/forms/form';

import type { Locale } from '@josecoded/types';


/** Comment box of a task: one textarea, the task id travels as a hidden field the action re-checks. */
export function TaskCommentForm({
  locale,
  taskId,
  labels,
}: {
  locale: Locale;
  taskId: string;
  labels: { label: string; help: string; submit: string; sent: string; form: string };
}) {
  return (
    <Form
      action={postTaskComment}
      submitLabel={labels.submit}
      label={labels.form}
      successMessage={labels.sent}
      resetOnSuccess
    >
      <Field kind="hidden" name="locale" value={locale} />
      <Field kind="hidden" name="taskId" value={taskId} />
      <Field
        kind="textarea"
        name="body"
        label={labels.label}
        help={labels.help}
        rows={4}
        maxLength={4000}
        required
      />
    </Form>
  );
}
