import type { MessageKey } from "@/i18n/keys.generated";
import type {
  InvitationActionLabels,
  InvitationListLabels,
  InviteSheetLabels,
  UserTableLabels,
} from "@/types/users";

type Translate = (key: MessageKey) => string;

export function userTableLabels(t: Translate): UserTableLabels {
  return {
    region: t("admin.users.table.region"),
    caption: t("admin.users.table.caption"),
    columns: {
      name: t("admin.users.table.columns.name"),
      role: t("admin.users.table.columns.role"),
      status: t("admin.users.table.columns.status"),
      parent: t("admin.users.table.columns.parent"),
      rates: t("admin.users.table.columns.rates"),
      cadence: t("admin.users.table.columns.cadence"),
      totp: t("admin.users.table.columns.totp"),
      contacts: t("admin.users.table.columns.contacts"),
      deals: t("admin.users.table.columns.deals"),
      pending: t("admin.users.table.columns.pending"),
    },
    roles: {
      admin: t("admin.users.table.roles.admin"),
      closer: t("admin.users.table.roles.closer"),
      freelance: t("admin.users.table.roles.freelance"),
      client: t("admin.users.table.roles.client"),
    },
    subcloser: t("admin.users.table.subcloser"),
    active: t("admin.users.table.active"),
    inactive: t("admin.users.table.inactive"),
    totpYes: t("admin.users.table.totpYes"),
    totpNo: t("admin.users.table.totpNo"),
    cadences: {
      per_payment: t("admin.users.table.cadences.per_payment"),
      weekly: t("admin.users.table.cadences.weekly"),
      biweekly: t("admin.users.table.cadences.biweekly"),
    },
    none: t("admin.users.table.none"),
  };
}

function invitationActionLabels(t: Translate): InvitationActionLabels {
  return {
    renew: t("admin.users.invitations.actions.renew"),
    renewing: t("admin.users.invitations.actions.renewing"),
    revoke: t("admin.users.invitations.actions.revoke"),
    revokeConfirm: t("admin.users.invitations.actions.revokeConfirm"),
    revoking: t("admin.users.invitations.actions.revoking"),
    cancel: t("admin.users.invitations.actions.cancel"),
    linkLabel: t("admin.users.invitations.actions.linkLabel"),
    copy: t("admin.users.invitations.actions.copy"),
    copied: t("admin.users.invitations.actions.copied"),
    doneRenew: t("admin.users.invitations.actions.doneRenew"),
    doneRevoke: t("admin.users.invitations.actions.doneRevoke"),
    errors: {
      email_already_invited: t("admin.users.invitations.actions.errors.email_already_invited"),
      email_already_member: t("admin.users.invitations.actions.errors.email_already_member"),
      invalid_parent_closer: t("admin.users.invitations.actions.errors.invalid_parent_closer"),
      rates_recurring_not_lower: t(
        "admin.users.invitations.actions.errors.rates_recurring_not_lower",
      ),
      rate_out_of_range: t("admin.users.invitations.actions.errors.rate_out_of_range"),
      forbidden: t("admin.users.invitations.actions.errors.forbidden"),
      unavailable: t("admin.users.invitations.actions.errors.unavailable"),
      error: t("admin.users.invitations.actions.errors.error"),
      invitation_used: t("admin.users.invitations.actions.errors.invitation_used"),
      invitation_revoked: t("admin.users.invitations.actions.errors.invitation_revoked"),
    },
  };
}

export function invitationListLabels(t: Translate): InvitationListLabels {
  return {
    title: t("admin.users.invitations.title"),
    empty: t("admin.users.invitations.empty"),
    region: t("admin.users.invitations.region"),
    caption: t("admin.users.invitations.caption"),
    columns: {
      email: t("admin.users.invitations.columns.email"),
      role: t("admin.users.invitations.columns.role"),
      by: t("admin.users.invitations.columns.by"),
      expires: t("admin.users.invitations.columns.expires"),
      status: t("admin.users.invitations.columns.status"),
      actions: t("admin.users.invitations.columns.actions"),
    },
    roles: {
      admin: t("admin.users.table.roles.admin"),
      closer: t("admin.users.table.roles.closer"),
      freelance: t("admin.users.table.roles.freelance"),
      client: t("admin.users.table.roles.client"),
    },
    status: {
      pending: t("admin.users.invitations.status.pending"),
      accepted: t("admin.users.invitations.status.accepted"),
      expired: t("admin.users.invitations.status.expired"),
      revoked: t("admin.users.invitations.status.revoked"),
    },
    subcloser: t("admin.users.table.subcloser"),
    unknownInviter: t("admin.users.invitations.unknownInviter"),
    actions: invitationActionLabels(t),
  };
}

export function inviteSheetLabels(t: Translate): InviteSheetLabels {
  return {
    open: t("admin.users.invite.open"),
    title: t("admin.users.invite.title"),
    close: t("admin.users.invite.close"),
    email: t("admin.users.invite.email"),
    role: t("admin.users.invite.role"),
    roles: {
      closer: t("admin.users.invite.roles.closer"),
      subcloser: t("admin.users.invite.roles.subcloser"),
      freelance: t("admin.users.invite.roles.freelance"),
      client: t("admin.users.invite.roles.client"),
    },
    parent: t("admin.users.invite.parent"),
    parentPlaceholder: t("admin.users.invite.parentPlaceholder"),
    noParents: t("admin.users.invite.noParents"),
    rates: t("admin.users.invite.rates"),
    closerRate: t("admin.users.invite.closerRate"),
    parentRate: t("admin.users.invite.parentRate"),
    closerRecurringRate: t("admin.users.invite.closerRecurringRate"),
    parentRecurringRate: t("admin.users.invite.parentRecurringRate"),
    rateHint: t("admin.users.invite.rateHint"),
    cadence: t("admin.users.invite.cadence"),
    cadences: {
      per_payment: t("admin.users.invite.cadences.per_payment"),
      weekly: t("admin.users.invite.cadences.weekly"),
      biweekly: t("admin.users.invite.cadences.biweekly"),
    },
    cadenceDefault: t("admin.users.invite.cadenceDefault"),
    note: t("admin.users.invite.note"),
    optional: t("admin.users.invite.optional"),
    preview: t("admin.users.invite.preview"),
    previewProject: t("admin.users.invite.previewProject"),
    previewParent: t("admin.users.invite.previewParent"),
    previewRecurring: t("admin.users.invite.previewRecurring"),
    submit: t("admin.users.invite.submit"),
    submitting: t("admin.users.invite.submitting"),
    doneTitle: t("admin.users.invite.doneTitle"),
    doneText: t("admin.users.invite.doneText"),
    linkLabel: t("admin.users.invite.linkLabel"),
    copy: t("admin.users.invite.copy"),
    copied: t("admin.users.invite.copied"),
    another: t("admin.users.invite.another"),
    errors: {
      email: t("admin.users.invite.errors.email"),
      role: t("admin.users.invite.errors.role"),
      parentCloserId: t("admin.users.invite.errors.parentCloserId"),
      closerRate: t("admin.users.invite.errors.closerRate"),
      parentRate: t("admin.users.invite.errors.parentRate"),
      closerRecurringRate: t("admin.users.invite.errors.closerRecurringRate"),
      parentRecurringRate: t("admin.users.invite.errors.parentRecurringRate"),
      payoutCadence: t("admin.users.invite.errors.payoutCadence"),
      note: t("admin.users.invite.errors.note"),
      email_already_invited: t("admin.users.invite.errors.email_already_invited"),
      email_already_member: t("admin.users.invite.errors.email_already_member"),
      invalid_parent_closer: t("admin.users.invite.errors.invalid_parent_closer"),
      rates_recurring_not_lower: t("admin.users.invite.errors.rates_recurring_not_lower"),
      rate_out_of_range: t("admin.users.invite.errors.rate_out_of_range"),
      forbidden: t("admin.users.invite.errors.forbidden"),
      unavailable: t("admin.users.invite.errors.unavailable"),
      error: t("admin.users.invite.errors.error"),
    },
  };
}
