import type { MessageKey } from "@/i18n/keys.generated";
import type { CrmCellLabels, DueListLabels } from "@/types/crm-overview";

type Translate = (key: MessageKey) => string;

export function cellLabels(t: Translate): CrmCellLabels {
  return {
    inbox: t("crm.overview.cells.inbox"),
    overdue: t("crm.overview.cells.overdue"),
    dueToday: t("crm.overview.cells.dueToday"),
    stages: {
      new: t("crm.overview.cells.stages.new"),
      contacted: t("crm.overview.cells.stages.contacted"),
      meeting: t("crm.overview.cells.stages.meeting"),
      proposal: t("crm.overview.cells.stages.proposal"),
    },
  };
}

export function dueListLabels(t: Translate): DueListLabels {
  return {
    listLabel: t("crm.overview.due.listLabel"),
    noAction: t("crm.overview.due.noAction"),
    overdue: t("crm.overview.due.overdue"),
  };
}
