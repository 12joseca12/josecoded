import { UpdateForm } from "@/components/admin/UpdateForm/UpdateForm";
import { UpdateItem } from "@/components/admin/UpdateItem/UpdateItem";
import { Heading } from "@/components/ui/Heading/Heading";
import type { UpdateHandler, UpdateRow, UpdatesPanelLabels } from "@/types/admin-project-updates";

import styles from "./UpdatesPanel.module.css";

interface UpdatesPanelProps {
  projectId: string;
  updates: UpdateRow[];
  freelanceId: string | null;
  freelanceName: string | null;
  tasks: { id: string; title: string }[];
  locale: string;
  labels: UpdatesPanelLabels;
  handlers: { create: UpdateHandler; setVisibility: UpdateHandler; remove: UpdateHandler };
}

export function UpdatesPanel({
  projectId,
  updates,
  freelanceId,
  freelanceName,
  tasks,
  locale,
  labels,
  handlers,
}: UpdatesPanelProps) {
  const titles = new Map(tasks.map((task) => [task.id, task.title]));
  const authorOf = (update: UpdateRow) =>
    update.author_id !== null && update.author_id === freelanceId
      ? (freelanceName ?? labels.authorFreelance)
      : labels.authorJose;

  return (
    <section className={styles.panel} aria-label={labels.title}>
      <div>
        <Heading level={2} size="h4">
          {labels.form.title}
        </Heading>
        <UpdateForm
          projectId={projectId}
          tasks={tasks}
          labels={labels.form}
          create={handlers.create}
        />
      </div>
      {updates.length === 0 ? (
        <p className={styles.empty}>{labels.empty}</p>
      ) : (
        <ul className={styles.list}>
          {updates.map((update) => (
            <li key={update.id}>
              <UpdateItem
                update={update}
                author={authorOf(update)}
                taskTitle={update.task_id === null ? null : (titles.get(update.task_id) ?? null)}
                locale={locale}
                labels={labels}
                setVisibility={handlers.setVisibility}
                remove={handlers.remove}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
