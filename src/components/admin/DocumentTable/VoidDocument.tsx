"use client";

import { ConfirmAction } from "@/components/admin/ConfirmAction/ConfirmAction";
import type { ConfirmHandler, ConfirmLabels } from "@/types/payments";

interface VoidDocumentProps {
  id: string;
  triggerText: string;
  triggerAria: string;
  confirm: ConfirmLabels;
  voidDocument: ConfirmHandler;
}

export function VoidDocument({
  id,
  triggerText,
  triggerAria,
  confirm,
  voidDocument,
}: VoidDocumentProps) {
  return (
    <ConfirmAction
      triggerText={triggerText}
      triggerAria={triggerAria}
      title={confirm.voidTitle}
      text={confirm.voidText}
      submitLabel={confirm.voidSubmit}
      savingLabel={confirm.saving}
      closeLabel={confirm.close}
      doneMessage={confirm.voidDone}
      errors={confirm.errors}
      run={() => voidDocument({ id })}
    />
  );
}
