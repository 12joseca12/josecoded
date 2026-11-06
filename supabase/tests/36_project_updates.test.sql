begin;

\ir support/helpers.sql

select plan(29);

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
select tests.create_user('u-admin@example.com', 'admin', 'Admin Name');
select tests.create_user('u-closer@example.com', 'closer', 'Closer');
select tests.create_user('u-free@example.com', 'freelance', 'Secret Freelance');
select tests.create_user('u-free2@example.com', 'freelance', 'Other Freelance');
select tests.create_user('u-client@example.com', 'client', 'Client');
select tests.create_user('u-client2@example.com', 'client', 'Client Two');

insert into public.projects (id, name, client_id, freelance_id) values
  ('00000000-0000-4000-8000-0000000000e1', 'Project One', md5('u-client@example.com')::uuid, md5('u-free@example.com')::uuid),
  ('00000000-0000-4000-8000-0000000000e2', 'Project Two', md5('u-client2@example.com')::uuid, md5('u-free2@example.com')::uuid);

insert into public.tasks (id, project_id, phase, title) values
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000e1', 'build', 'Task one'),
  ('00000000-0000-4000-8000-0000000000f2', '00000000-0000-4000-8000-0000000000e2', 'build', 'Task two');

reset role;
select tests.login_as('u-free@example.com');

select lives_ok($$insert into public.project_updates (project_id, body) values ('00000000-0000-4000-8000-0000000000e1', 'Internal note')$$, 'the freelance writes an update in their project');
select lives_ok($$insert into public.project_updates (project_id, body, visibility, task_id) values ('00000000-0000-4000-8000-0000000000e1', 'Shared progress', 'client', '00000000-0000-4000-8000-0000000000f1')$$, 'the freelance publishes an update with a task');
select throws_ok($$insert into public.project_updates (project_id, body) values ('00000000-0000-4000-8000-0000000000e2', 'Not mine')$$, 'P0001', 'not_project_team', 'the freelance cannot write in another project');
select throws_ok($$insert into public.project_updates (project_id, body, task_id) values ('00000000-0000-4000-8000-0000000000e1', 'Wrong task', '00000000-0000-4000-8000-0000000000f2')$$, 'P0001', 'task_project_mismatch', 'a task of another project fails');
select throws_ok($$insert into public.project_updates (project_id, body) values ('00000000-0000-4000-8000-0000000000e1', repeat('x', 2001))$$, '23514', null, 'a body over 2000 characters fails');
select throws_ok($$insert into public.project_updates (project_id, body, author_id) values ('00000000-0000-4000-8000-0000000000e1', 'Forged', md5('u-admin@example.com')::uuid)$$, '42501', null, 'the author cannot be set by the client');
select is((select count(*)::int from public.project_updates where author_id = md5('u-free@example.com')::uuid), 2, 'the author is always the caller');
select lives_ok($$select public.set_update_visibility((select id from public.project_updates where body = 'Internal note'), 'client')$$, 'the author changes the visibility of their update');

reset role;
select tests.login_as('u-admin@example.com');
select lives_ok($$insert into public.project_updates (project_id, body, visibility) values ('00000000-0000-4000-8000-0000000000e1', 'From Jose', 'client')$$, 'the admin writes an update');
select lives_ok($$select public.set_update_visibility((select id from public.project_updates where body = 'Shared progress'), 'internal')$$, 'the admin changes any visibility');
select lives_ok($$select public.set_update_visibility((select id from public.project_updates where body = 'Shared progress'), 'client')$$, 'and back');
select is((select count(*)::int from public.project_updates), 3, 'the admin reads every update');

reset role;
select tests.login_as('u-free@example.com');
select throws_ok($$select public.set_update_visibility((select id from public.project_updates where body = 'From Jose'), 'internal')$$, '42501', 'forbidden', 'the freelance cannot change the visibility of an update of Jose');
select is((select count(*)::int from public.project_updates), 3, 'the freelance reads the updates of their project');
select lives_ok($$select public.set_update_visibility((select id from public.project_updates where body = 'Shared progress'), 'internal')$$, 'the freelance hides their own update again');
select is((select count(*)::int from public.project_updates where body = 'From Jose'), 1, 'the freelance reads the update of Jose');
select is(pg_temp.affected($$delete from public.project_updates where body = 'From Jose'$$), 0::bigint, 'the freelance cannot delete an update of Jose');

reset role;
select tests.login_as('u-free2@example.com');
select is((select count(*)::int from public.project_updates), 0, 'another freelance reads nothing');

reset role;
select tests.login_as('u-closer@example.com');
select is((select count(*)::int from public.project_updates) + (select count(*)::int from public.client_project_updates), 0, 'a closer reads nothing');

reset role;
select tests.login_as('u-client@example.com');
select is((select count(*)::int from public.project_updates), 0, 'the client cannot read project_updates');
select throws_ok($$insert into public.project_updates (project_id, body) values ('00000000-0000-4000-8000-0000000000e1', 'Client note')$$, 'P0001', 'not_project_team', 'the client cannot write updates');
select is((select count(*)::int from public.client_project_updates), 2, 'the client reads only the published updates of their project');
select is(
  (select string_agg(author_label, ',' order by body) from public.client_project_updates),
  'jose,team', 'the author is only a label'
);
select hasnt_column('public', 'client_project_updates', 'author_id', 'the client view has no author id');

reset role;
select tests.login_as('u-client2@example.com');
select is((select count(*)::int from public.client_project_updates), 0, 'another client sees nothing');

reset role;
select is(
  (select count(*)::int from public.notifications where user_id = md5('u-client@example.com')::uuid and event = 'project_update' and title = 'Equipo'),
  3, 'the client is notified as Equipo'
);
select is(
  (select count(*)::int from public.notifications where user_id = md5('u-client@example.com')::uuid and event = 'project_update' and (title || coalesce(body, '') || coalesce(href, '')) ilike '%Secret Freelance%'),
  0, 'client notifications never carry the freelance name'
);
select is(
  (select count(*)::int from public.notifications where user_id = md5('u-admin@example.com')::uuid and event = 'project_update'),
  2, 'the admin is told about each update of the freelance'
);

select tests.login_as('u-free@example.com');
select is(pg_temp.affected($$delete from public.project_updates where body = 'Internal note'$$), 1::bigint, 'the author deletes their own update');

select * from finish();

rollback;
