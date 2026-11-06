"use client";

import { useRouter } from "next/navigation";

import { Link } from "@/components/ui/Link/Link";
import type { ChatLead, CreateContactResult, CreateLeadLabels } from "@/types/admin-chat";

import { ConfirmAction } from "../ConfirmAction/ConfirmAction";
import styles from "./CreateLeadSheet.module.css";

interface CreateLeadSheetProps {
  lead: ChatLead | null;
  labels: CreateLeadLabels;
  leadHref: string | null;
  contactHref: string | null;
  create: (leadId: string) => Promise<CreateContactResult>;
}

export function CreateLeadSheet({
  lead,
  labels,
  leadHref,
  contactHref,
  create,
}: CreateLeadSheetProps) {
  const router = useRouter();
  const converted = lead !== null && lead.contact_id !== null;

  return (
    <section className={styles.section} aria-labelledby="chat-lead-title">
      <h2 id="chat-lead-title" className={styles.title}>
        {labels.title}
      </h2>
      {lead === null ? (
        <p className={styles.text}>{labels.none}</p>
      ) : converted ? (
        <>
          <p className={styles.text}>{labels.converted}</p>
          <div className={styles.links}>
            {contactHref ? <Link href={contactHref}>{labels.openContact}</Link> : null}
            {leadHref ? <Link href={leadHref}>{labels.openLead}</Link> : null}
          </div>
        </>
      ) : (
        <>
          <p className={styles.text}>{labels.ready.replace("{name}", lead.full_name)}</p>
          <ConfirmAction
            triggerText={labels.button}
            triggerAria={labels.button}
            title={labels.confirmTitle}
            text={labels.confirmText}
            submitLabel={labels.submit}
            savingLabel={labels.saving}
            closeLabel={labels.close}
            doneMessage={labels.done}
            errors={labels.errors}
            run={async () => {
              const result = await create(lead.id);
              if (result.status === "done") router.refresh();
              return result;
            }}
          />
          {leadHref ? <Link href={leadHref}>{labels.openLead}</Link> : null}
        </>
      )}
    </section>
  );
}
