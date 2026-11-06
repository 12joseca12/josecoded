import { EmptyState } from "@/components/ui/EmptyState/EmptyState";
import type {
  DecideHandler,
  StoryDecisionLabels,
  StoryListLabels,
  StoryRow,
} from "@/types/admin-project-stories";

import { StoryCard } from "./StoryCard";
import styles from "./StoryList.module.css";

interface StoryListProps {
  stories: StoryRow[];
  locale: string;
  labels: StoryListLabels;
  decisionLabels: StoryDecisionLabels;
  decide: DecideHandler;
}

export function StoryList({ stories, locale, labels, decisionLabels, decide }: StoryListProps) {
  if (stories.length === 0) {
    return <EmptyState headingLevel={3} title={labels.empty.title} text={labels.empty.text} />;
  }
  const groups = [
    {
      id: "proposed",
      title: labels.groups.proposed,
      items: stories.filter((s) => s.status === "proposed"),
    },
    {
      id: "in_review",
      title: labels.groups.in_review,
      items: stories.filter((s) => s.status === "in_review"),
    },
    {
      id: "decided",
      title: labels.groups.decided,
      items: stories.filter((s) => s.status !== "proposed" && s.status !== "in_review"),
    },
  ];
  return (
    <div className={styles.groups}>
      {groups
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <section key={group.id} className={styles.group} aria-labelledby={`stories-${group.id}`}>
            <h3 className={styles.groupTitle} id={`stories-${group.id}`}>
              {group.title}
              <span className={styles.count}>{group.items.length}</span>
            </h3>
            {group.items.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                locale={locale}
                labels={labels}
                decisionLabels={decisionLabels}
                decide={decide}
              />
            ))}
          </section>
        ))}
    </div>
  );
}
