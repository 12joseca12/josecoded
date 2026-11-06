import { InviteSheet } from "@/components/admin/InviteSheet/InviteSheet";
import { LeadsError } from "@/components/admin/LeadsError/LeadsError";
import { LinkEditor } from "@/components/admin/LinkEditor/LinkEditor";
import { PhaseBoard } from "@/components/admin/PhaseBoard/PhaseBoard";
import { StoryList } from "@/components/admin/StoryList/StoryList";
import { TeamPanel } from "@/components/admin/TeamPanel/TeamPanel";
import { FileList } from "@/components/area/FileList/FileList";
import { Uploader } from "@/components/area/Uploader/Uploader";
import { AnnouncerProvider } from "@/components/ui/Announcer/Announcer";
import type { Locale } from "@/i18n/config";
import { getTranslator } from "@/i18n/messages";
import { fetchProjectLinks } from "@/lib/admin/project-links";
import { fetchProjectStories } from "@/lib/admin/project-stories";
import type { ProjectTabId } from "@/lib/admin/project-tabs";
import { fetchProjectRoomId, fetchTeamPeople } from "@/lib/admin/project-team";
import { fetchProjectDocuments } from "@/lib/documents/project-documents";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Assignee, TaskRow } from "@/types/admin-project-detail";
import type { ProjectRow } from "@/types/admin-projects";

import {
  addLink,
  decideStory,
  deleteLink,
  deleteTask,
  moveTask,
  reorderLinks,
  setProjectClient,
  setProjectFreelance,
  updateLink,
  upsertTask,
} from "../actions";
import {
  fileListLabels,
  linkEditorLabels,
  phaseBoardLabels,
  storyDecisionLabels,
  storyListLabels,
  taskSheetLabels,
  teamPanelLabels,
  uploaderLabels,
} from "../labels";
import detail from "./detail.module.css";

interface TabContentProps {
  tab: ProjectTabId;
  locale: Locale;
  row: ProjectRow;
  tasks: TaskRow[];
  assignees: Assignee[];
  inviteLabels: Parameters<typeof InviteSheet>[0]["labels"];
  inviteHandler: Parameters<typeof InviteSheet>[0]["invite"];
}

export async function ProjectTabContent({
  tab,
  locale,
  row,
  tasks,
  assignees,
  inviteLabels,
  inviteHandler,
}: TabContentProps) {
  const t = await getTranslator(locale);
  const failure = (
    <LeadsError
      title={t("admin.projects.detail.error.title")}
      text={t("admin.projects.detail.error.text")}
      retryLabel={t("admin.projects.detail.error.retry")}
      loadingLabel={t("admin.projects.detail.error.retrying")}
    />
  );

  if (tab === "tasks") {
    return (
      <section aria-label={t("admin.projects.detail.tasks.board.region")}>
        <PhaseBoard
          projectId={row.id}
          tasks={tasks}
          assignees={assignees}
          currentPhase={row.phase}
          labels={phaseBoardLabels(t)}
          sheetLabels={taskSheetLabels(t)}
          handlers={{
            save: upsertTask.bind(null, locale),
            remove: deleteTask.bind(null, locale),
            move: moveTask.bind(null, locale),
          }}
        />
      </section>
    );
  }

  const client = await createSupabaseServerClient();
  if (client === null) return failure;

  if (tab === "stories") {
    const stories = await fetchProjectStories(client, row.id);
    if (stories.status === "error") return failure;
    return (
      <AnnouncerProvider>
        <section aria-label={t("admin.projects.detail.tabs.stories")}>
          <StoryList
            stories={stories.stories}
            locale={locale}
            labels={storyListLabels(t)}
            decisionLabels={storyDecisionLabels(t)}
            decide={decideStory.bind(null, locale)}
          />
        </section>
      </AnnouncerProvider>
    );
  }

  if (tab === "documents") {
    const documents = await fetchProjectDocuments(client, row.id);
    if (documents.status === "error") return failure;
    return (
      <AnnouncerProvider>
        <section className={detail.stack} aria-label={t("admin.projects.detail.tabs.documents")}>
          <Uploader projectId={row.id} variant="admin" labels={uploaderLabels(t)} />
          <FileList
            files={documents.documents}
            variant="admin"
            locale={locale}
            labels={fileListLabels(t)}
          />
        </section>
      </AnnouncerProvider>
    );
  }

  if (tab === "links") {
    const links = await fetchProjectLinks(client, row.id);
    if (links.status === "error") return failure;
    return (
      <AnnouncerProvider>
        <LinkEditor
          projectId={row.id}
          links={links.links}
          labels={linkEditorLabels(t)}
          handlers={{
            add: addLink.bind(null, locale),
            update: updateLink.bind(null, locale),
            remove: deleteLink.bind(null, locale),
            reorder: reorderLinks.bind(null, locale),
          }}
        />
      </AnnouncerProvider>
    );
  }

  const [people, roomId] = await Promise.all([
    fetchTeamPeople(client),
    fetchProjectRoomId(client, row.id),
  ]);
  if (people.status === "error") return failure;
  return (
    <AnnouncerProvider>
      <section aria-label={t("admin.projects.detail.tabs.team")}>
        <TeamPanel
          projectId={row.id}
          clientId={row.client_id}
          clientName={row.client_name}
          freelanceId={row.freelance_id}
          clients={people.clients}
          freelances={people.freelances}
          archived={row.archived_at !== null}
          roomHref={roomId === null ? null : `/${locale}/admin/chat/${roomId}`}
          labels={teamPanelLabels(t)}
          handlers={{
            setClient: setProjectClient.bind(null, locale),
            setFreelance: setProjectFreelance.bind(null, locale),
          }}
          invite={
            <InviteSheet
              locale={locale}
              labels={{
                ...inviteLabels,
                open: t("admin.projects.detail.team.invite.open"),
                title: t("admin.projects.detail.team.invite.title"),
              }}
              parents={[]}
              invite={inviteHandler}
              projectId={row.id}
            />
          }
        />
      </section>
    </AnnouncerProvider>
  );
}
