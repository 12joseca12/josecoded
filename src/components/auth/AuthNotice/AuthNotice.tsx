import type { Ref } from "react";

import { Card } from "@/components/ui/Card/Card";
import { Heading } from "@/components/ui/Heading/Heading";
import type { NoticeLabels } from "@/types/auth";

import styles from "./AuthNotice.module.css";

interface AuthNoticeProps {
  notice: NoticeLabels;
  ref?: Ref<HTMLDivElement>;
}

export function AuthNotice({ notice, ref }: AuthNoticeProps) {
  return (
    <div ref={ref} role="alert" tabIndex={-1} className={styles.notice}>
      <Card tone="error" size="sm">
        <Heading level={2} size="h4">
          {notice.title}
        </Heading>
        <p>{notice.text}</p>
      </Card>
    </div>
  );
}
