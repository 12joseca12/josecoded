begin;

\ir support/helpers.sql

select plan(96);

create function pg_temp.affected(p_sql text)
returns bigint
language plpgsql
as $$
declare
  v_rows bigint;
begin
  execute p_sql;
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

grant execute on function pg_temp.affected(text) to public;

select tests.clean();
select tests.create_user('p-admin@example.com', 'admin', 'Admin');
select tests.create_user('p-closer@example.com', 'closer', 'Closer');
select tests.create_user('p-free@example.com', 'freelance', 'Freelance');
select tests.create_user('p-free2@example.com', 'freelance', 'Freelance Two');
select tests.create_user('p-client@example.com', 'client', 'Client');
select tests.create_user('p-client2@example.com', 'client', 'Client Two');

insert into public.contacts (id, owner_id, full_name, email) values
  ('00000000-0000-4000-8000-0000000000a1', md5('p-closer@example.com')::uuid, 'Contact A1', 'a1@example.com');

insert into public.deals (id, contact_id, stage, via, won_at) values
  ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000a1', 'won', 'project', now()),
  ('00000000-0000-4000-8000-0000000000d2', '00000000-0000-4000-8000-0000000000a1', 'proposal', 'project', null);

reset role;
select tests.login_as('p-closer@example.com');

select throws_ok($$select public.create_project('X')$$, '42501', 'forbidden', 'a closer cannot create projects');
select throws_ok($$select public.set_project_phase(gen_random_uuid(), 'build')$$, '42501', 'forbidden', 'a closer cannot change a phase');
select throws_ok($$select public.upsert_task(gen_random_uuid(), 'T', 'build')$$, '42501', 'forbidden', 'a closer cannot write tasks');
select throws_ok($$select public.decide_story(gen_random_uuid(), 'accept')$$, '42501', 'forbidden', 'a closer cannot decide stories');

reset role;
select tests.login_aal1('p-admin@example.com');

select throws_ok($$select public.create_project('X')$$, '42501', 'forbidden', 'an admin without aal2 cannot create projects');

reset role;
select tests.login_as('p-admin@example.com');

select throws_ok($$select public.create_project('  ')$$, 'P0001', 'invalid_name', 'a blank name fails');
select throws_ok($$select public.create_project('X', null, '00000000-0000-4000-8000-0000000000d2')$$, 'P0001', 'deal_not_won', 'a deal that is not won fails');
select throws_ok($$select public.create_project('X', null, gen_random_uuid())$$, 'P0001', 'deal_not_found', 'an unknown deal fails');
select throws_ok($$select public.create_project('X', null, null, 'web-nope')$$, 'P0001', 'offer_not_found', 'an unknown offer fails');
select throws_ok($$select public.create_project('X', null, null, null, null, md5('p-client@example.com')::uuid)$$, 'P0001', 'invalid_freelance', 'a client cannot be the freelance');
select throws_ok($$select public.create_project('X', null, null, null, null, null, '2026-02-01', '2026-01-01')$$, 'P0001', 'invalid_dates', 'a due date before the start fails');

create temp table ids (k text primary key, v uuid);
grant all on ids to public;

insert into ids values (
  'p1',
  public.create_project('Project One', null, '00000000-0000-4000-8000-0000000000d1', 'web-negocio', 'Brief', md5('p-free@example.com')::uuid, '2026-01-01', '2026-03-01')
);
insert into ids values ('p2', public.create_project('Project Two'));

select is(
  (select contact_id from public.projects where id = (select v from ids where k = 'p1')),
  '00000000-0000-4000-8000-0000000000a1'::uuid,
  'the contact comes from the won deal'
);
select is((select phase::text from public.projects where id = (select v from ids where k = 'p2')), 'discover', 'a new project starts in discover');
select is((select client_id from public.projects where id = (select v from ids where k = 'p2')), null::uuid, 'a project can exist without a client account');

select throws_ok(
  $$select public.set_project_client((select v from ids where k = 'p1'), md5('p-free@example.com')::uuid)$$,
  'P0001', 'invalid_client', 'a freelance cannot be set as client'
);
select throws_ok($$select public.set_project_client(gen_random_uuid(), md5('p-client@example.com')::uuid)$$, 'P0001', 'project_not_found', 'an unknown project fails');
select lives_ok($$select public.set_project_client((select v from ids where k = 'p1'), md5('p-client@example.com')::uuid)$$, 'the admin sets the client');
select lives_ok($$select public.set_project_client((select v from ids where k = 'p2'), md5('p-client2@example.com')::uuid)$$, 'the admin sets another client on the other project');
select lives_ok($$select public.set_project_phase((select v from ids where k = 'p1'), 'build')$$, 'the admin changes the phase');

reset role;
select is(
  (select count(*) from private.audit_log where table_name = 'projects' and row_id = (select v from ids where k = 'p1') and action = 'update' and after ->> 'phase' = 'build'),
  1::bigint,
  'a phase change is audited'
);
select is(
  (select count(*) from private.audit_log where table_name = 'projects' and row_id = (select v from ids where k = 'p1') and action = 'update' and after ->> 'client_id' is not null),
  2::bigint,
  'a client change is audited'
);

reset role;
select tests.login_as('p-admin@example.com');

insert into ids values ('t1', public.upsert_task((select v from ids where k = 'p1'), 'Task one', 'build', null, 'Desc', 'todo', md5('p-client@example.com')::uuid));
insert into ids values ('t2', public.upsert_task((select v from ids where k = 'p1'), 'Task two', 'build', null, null, 'todo', md5('p-free@example.com')::uuid));
insert into ids values ('t3', public.upsert_task((select v from ids where k = 'p1'), 'Task three', 'build'));
insert into ids values ('t4', public.upsert_task((select v from ids where k = 'p1'), 'Task four', 'design', null, null, 'done'));

select is((select sort from public.tasks where id = (select v from ids where k = 't3')), 2, 'new tasks go to the end of their phase');
select throws_ok(
  $$select public.upsert_task((select v from ids where k = 'p1'), 'Bad', 'build', null, null, 'todo', md5('p-free2@example.com')::uuid)$$,
  'P0001', 'invalid_assignee', 'only the client or the freelance of the project can be assigned'
);
select throws_ok(
  $$select public.upsert_task((select v from ids where k = 'p2'), 'Bad', 'build', (select v from ids where k = 't1'))$$,
  'P0001', 'task_project_mismatch', 'a task cannot move to another project through upsert'
);
select is((select status::text from public.tasks where id = (select v from ids where k = 't4')), 'done', 'a task can be created done');
select isnt((select done_at from public.tasks where id = (select v from ids where k = 't4')), null::timestamptz, 'a done task has done_at');

select is(
  (select row(done, total, percent)::text from public.project_progress where project_id = (select v from ids where k = 'p1')),
  '(1,4,25)',
  'project_progress counts done over total'
);

select lives_ok($$select public.move_task((select v from ids where k = 't3'), 'build', 0)$$, 'the admin moves a task');
select is((select sort from public.tasks where id = (select v from ids where k = 't3')), 0, 'the moved task takes the position');
select is((select sort from public.tasks where id = (select v from ids where k = 't1')), 1, 'the others shift down');
select lives_ok($$select public.move_task((select v from ids where k = 't3'), 'build', 2)$$, 'the admin moves a task further down');
select is(
  (select array_agg(title order by sort) from public.tasks where project_id = (select v from ids where k = 'p1') and phase = 'build'),
  array['Task one', 'Task two', 'Task three'],
  'moving down renumbers the whole phase'
);
select lives_ok($$select public.move_task((select v from ids where k = 't3'), 'design', 0)$$, 'the admin moves a task to another phase');
select is(
  (select row(phase::text, sort)::text from public.tasks where id = (select v from ids where k = 't3')),
  '(design,0)',
  'the moved task leads the target phase'
);
select lives_ok($$select public.move_task((select v from ids where k = 't3'), 'build', 0)$$, 'the admin moves it back');

select throws_ok($$select public.delete_task((select v from ids where k = 't4'))$$, 'P0001', 'task_not_deletable', 'a done task cannot be deleted');
select lives_ok($$select public.delete_task((select v from ids where k = 't3'))$$, 'a todo task without story can be deleted');

reset role;
select tests.login_as('p-client@example.com');

select is((select count(*) from public.projects), 1::bigint, 'the client reads only their project');
select is((select count(*) from public.tasks), 3::bigint, 'the client reads the tasks of their project');
select is((select count(*) from public.project_overview), 1::bigint, 'the client sees their overview row');
select is(
  pg_temp.affected($q$update public.projects set name = 'Hacked'$q$),
  0::bigint,
  'the client cannot update projects'
);
select throws_ok($$select public.complete_my_task((select v from ids where k = 't2'))$$, '42501', 'forbidden', 'the client cannot complete a task assigned to someone else');
select lives_ok($$select public.complete_my_task((select v from ids where k = 't1'))$$, 'the client completes their own task');
select is((select status::text from public.tasks where id = (select v from ids where k = 't1')), 'done', 'the task is done');
select is((select done_by from public.tasks where id = (select v from ids where k = 't1')), md5('p-client@example.com')::uuid, 'done_by is the client');

with i as (
  insert into public.stories (project_id, author_id, title, as_a, i_want, so_that, criteria)
  values ((select v from ids where k = 'p1'), md5('p-client@example.com')::uuid, 'Story', 'a', 'b', 'c', array['x', 'y'])
  returning id
)
insert into ids select 's1', id from i;

select is((select status::text from public.stories where id = (select v from ids where k = 's1')), 'proposed', 'a client story starts proposed');
select lives_ok($$update public.stories set title = 'Story edited' where id = (select v from ids where k = 's1')$$, 'the client edits a proposed story');
select throws_ok(
  $$insert into public.stories (project_id, author_id, title, as_a, i_want, so_that, status) values ((select v from ids where k = 'p1'), md5('p-client@example.com')::uuid, 'S', 'a', 'b', 'c', 'accepted')$$,
  '42501', null, 'the client cannot choose a status'
);
select throws_ok(
  $$insert into public.stories (project_id, author_id, title, as_a, i_want, so_that) values ((select v from ids where k = 'p2'), md5('p-client@example.com')::uuid, 'S', 'a', 'b', 'c')$$,
  '42501', null, 'the client cannot write stories on a project that is not theirs'
);

reset role;
select tests.login_as('p-client2@example.com');

select is((select count(*) from public.projects where id = (select v from ids where k = 'p1')), 0::bigint, 'another client does not read the project');
select is((select count(*) from public.tasks where project_id = (select v from ids where k = 'p1')), 0::bigint, 'another client does not read the tasks');
select is((select count(*) from public.stories), 0::bigint, 'another client does not read the stories');

reset role;
select tests.login_as('p-admin@example.com');

select throws_ok($$select public.decide_story((select v from ids where k = 's1'), 'maybe')$$, 'P0001', 'invalid_decision', 'an unknown decision fails');
select throws_ok($$select public.decide_story((select v from ids where k = 's1'), 'reject')$$, 'P0001', 'note_required', 'rejecting needs a note');
select throws_ok($$select public.decide_story((select v from ids where k = 's1'), 'out_of_scope', 10)$$, 'P0001', 'estimate_required', 'out of scope needs hours and amount');
select is(public.decide_story((select v from ids where k = 's1'), 'out_of_scope', 10, 400, 'Extra work')::text, 'in_review', 'out of scope goes to in_review');
select throws_ok($$select public.decide_story((select v from ids where k = 's1'), 'accept')$$, 'P0001', 'story_not_proposed', 'a decided story cannot be decided again');

reset role;
select tests.login_as('p-client@example.com');

select is(
  pg_temp.affected($q$update public.stories set title = 'Late edit' where id = (select v from ids where k = 's1')$q$),
  0::bigint,
  'the client cannot edit a story after the decision'
);
select is(
  pg_temp.affected($q$delete from public.stories where id = (select v from ids where k = 's1')$q$),
  0::bigint,
  'the client cannot delete a story after the decision'
);
select is((select estimate_amount from public.stories where id = (select v from ids where k = 's1')), 400.00, 'the client sees the indicative amount');

reset role;
select tests.login_as('p-client2@example.com');
select throws_ok($$select public.confirm_story((select v from ids where k = 's1'))$$, '42501', 'forbidden', 'only the author confirms a story');

reset role;
select tests.login_as('p-client@example.com');
select is(public.confirm_story((select v from ids where k = 's1'))::text, 'accepted', 'the author confirms the quote');
select is((select out_of_scope from public.stories where id = (select v from ids where k = 's1')), true, 'the story stays marked out of scope');
select isnt((select confirmed_at from public.stories where id = (select v from ids where k = 's1')), null::timestamptz, 'the confirmation is dated');
select throws_ok($$select public.confirm_story((select v from ids where k = 's1'))$$, 'P0001', 'story_not_in_review', 'a confirmed story cannot be confirmed again');

with i as (
  insert into public.stories (project_id, author_id, title, as_a, i_want, so_that)
  select (select v from ids where k = 'p1'), md5('p-client@example.com')::uuid, 'Story ' || n, 'a', 'b', 'c'
  from generate_series(2, 4) n
  returning id, title
)
insert into ids select lower(replace(title, 'Story ', 's')), id from i;

reset role;
select tests.login_as('p-admin@example.com');

select is(public.decide_story((select v from ids where k = 's2'), 'accept', 5, 200, 'Ok', true)::text, 'in_tasks', 'accepting with create_task leaves the story in_tasks');
select is(
  (select count(*) from public.tasks t join public.stories s on s.task_id = t.id and t.story_id = s.id where s.id = (select v from ids where k = 's2')),
  1::bigint,
  'the story and the task point at each other'
);
select throws_ok($$select public.delete_task((select task_id from public.stories where id = (select v from ids where k = 's2')))$$, 'P0001', 'task_not_deletable', 'a task born from a story cannot be deleted');
select is(public.decide_story((select v from ids where k = 's3'), 'accept')::text, 'accepted', 'accepting without a task leaves the story accepted');
select is(public.decide_story((select v from ids where k = 's4'), 'out_of_scope', 3, 90)::text, 'in_review', 'a second quote goes to review');

reset role;
select tests.login_as('p-client@example.com');
select is(public.confirm_story((select v from ids where k = 's4'), false)::text, 'rejected', 'the client can decline a quote');

select is(
  pg_temp.affected($q$delete from public.stories where id = (select v from ids where k = 's3')$q$),
  0::bigint,
  'the client cannot delete an accepted story'
);

reset role;
select tests.login_as('p-free@example.com');

select is((select count(*) from public.projects), 0::bigint, 'the freelance reads nothing directly from projects');
select is((select count(*) from public.project_overview), 0::bigint, 'the freelance has no overview rows');
select is((select count(*) from public.stories), 0::bigint, 'the freelance reads no stories');
select is((select count(*) from public.freelance_projects), 1::bigint, 'the freelance reads the freelance_projects view');
select is(
  (select name || '|' || brief from public.freelance_projects),
  'Project One|Brief',
  'the freelance sees name and brief'
);
select is(
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'freelance_projects' and column_name in ('client_id', 'contact_id', 'deal_id', 'offer_slug', 'freelance_id')),
  0::bigint,
  'the freelance view exposes no client, contact, deal or amount columns'
);
select cmp_ok((select count(*) from public.tasks), '>', 0::bigint, 'the freelance reads the tasks of their project');
select lives_ok($$select public.complete_my_task((select v from ids where k = 't2'))$$, 'the freelance completes their own task');

reset role;
select tests.login_aal1('p-free@example.com');
select is((select count(*) from public.freelance_projects), 0::bigint, 'the freelance without aal2 sees nothing');
select is((select count(*) from public.tasks), 0::bigint, 'the freelance without aal2 reads no tasks');

reset role;
select tests.login_as('p-free2@example.com');
select is((select count(*) from public.freelance_projects), 0::bigint, 'another freelance does not see the project');
select is((select count(*) from public.tasks), 0::bigint, 'another freelance reads no tasks');

reset role;
select tests.login_as('p-closer@example.com');
select is((select count(*) from public.projects), 0::bigint, 'the closer reads no projects');
select is((select count(*) from public.tasks), 0::bigint, 'the closer reads no tasks');
select is((select count(*) from public.stories), 0::bigint, 'the closer reads no stories');

reset role;
select tests.login_as('p-admin@example.com');

select lives_ok($$select public.set_project_freelance((select v from ids where k = 'p1'), md5('p-free2@example.com')::uuid)$$, 'the admin replaces the freelance');
select is((select assignee_id from public.tasks where id = (select v from ids where k = 't2')), null::uuid, 'the tasks of the previous freelance are unassigned');
select throws_ok($$select public.set_project_freelance((select v from ids where k = 'p1'), md5('p-client@example.com')::uuid)$$, 'P0001', 'invalid_freelance', 'a client cannot be the freelance');

select lives_ok($$select public.archive_project((select v from ids where k = 'p2'))$$, 'the admin archives a project');
select is((select status::text from public.projects where id = (select v from ids where k = 'p2')), 'closed', 'an archived project is closed');
select throws_ok($$select public.set_project_phase((select v from ids where k = 'p2'), 'build')$$, 'P0001', 'project_archived', 'an archived project keeps its phase');
select lives_ok($$select public.archive_project((select v from ids where k = 'p2'), false)$$, 'the admin restores it');

select throws_ok(
  $$select * from public.invite_user('c@example.com', 'client', p_project_id => gen_random_uuid())$$,
  '23503', null, 'inviting a client to a project that does not exist fails'
);
select lives_ok(
  $$select * from public.invite_user('c@example.com', 'client', p_project_id => (select v from ids where k = 'p2'))$$,
  'inviting a client to an existing project works'
);

select * from finish();

rollback;
