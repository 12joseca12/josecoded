import { previewTeam } from '@/lib/dev/crm-fixtures';
import { personColumnId, ruleKey } from '@/lib/notifications/rules';

import type { RuleCandidate, RulesState } from '@/lib/notifications/rules';

/**
 * The rules of the previews: the ones DATOS §14.6 seeds (the migration `notification_rules`) plus Marta, who has a
 * rule of her own. Names come from the team fixtures, so the two admin screens tell the same story.
 */
export function previewRules(): { state: RulesState; candidates: RuleCandidate[] } {
  const closers = previewTeam().members.filter((member) => member.role === 'closer' && !member.disabled);
  const marta = closers[0]!;
  const column = personColumnId(marta.id, 'telegram');
  return {
    state: {
      people: [{ id: column, kind: 'user', channel: 'telegram', userId: marta.id, name: marta.name }],
      on: [
        ...[
          ['leadCreated', 'admin'], ['leadCreated', 'owner'], ['leadCloseRequested', 'admin'], ['importDone', 'owner'],
          ['importConflicts', 'admin'], ['importConflictResolved', 'owner'], ['quoteSent', 'admin'], ['staffInvited', 'client'],
          ['staffClaimed', 'admin'], ['clientInvited', 'client'], ['storyProposed', 'admin'], ['storyProposed', 'owner'],
          ['storyDecided', 'client'], ['commissionCreated', 'owner'], ['commissionCreated', 'admin'], ['commissionApproved', 'owner'],
          ['commissionPaid', 'owner'], ['commissionRejected', 'owner'], ['contentDeployed', 'admin'], ['contentDeployFailed', 'admin'],
          ['commentClient', 'admin'], ['commentClient', 'owner'], ['commentPending', 'admin'], ['assetUploaded', 'admin'],
          ['upgradeRequested', 'admin'], ['chatVisitorMessage', 'admin'],
        ].map(([event, id]) => ruleKey(event as never, id!)),
        ruleKey('chatVisitorMessage', column),
        ruleKey('leadCreated', column),
      ],
    },
    candidates: closers.slice(1).map((member) => ({ id: member.id, name: member.name })),
  };
}
