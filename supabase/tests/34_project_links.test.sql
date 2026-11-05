begin;

\ir support/helpers.sql

select plan(23);

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
select tests.create_user('l-admin@example.com', 'admin', 'Admin');
select tests.create_user('l-closer@example.com', 'closer', 'Closer');
select tests.create_user('l-free@example.com', 'freelance', 'Freelance');
select tests.create_user('l-client@example.com', 'client', 'Client');
select tests.create_user('l-client2@example.com', 'client', 'Client Two');

insert into public.projects (id, name, client_id, freelance_id) values
  ('00000000-0000-4000-8000-0000000000b1', 'Project One', md5('l-client@example.com')::uuid, md5('l-free@example.com')::uuid),
  ('00000000-0000-4000-8000-0000000000b2', 'Project Two', md5('l-client2@example.com')::uuid, null);

reset role;
select tests.login_as('l-admin@example.com');

insert into public.project_links (project_id, name, url, usage) values
  ('00000000-0000-4000-8000-0000000000b1', 'Staging', 'https://staging.example.com/', 'Preview of the site'),
  ('00000000-0000-4000-8000-0000000000b1', 'Design', 'https://www.figma.com/file/abc', null),
  ('00000000-0000-4000-8000-0000000000b1', 'Repo', 'https://github.com/example/repo', 'Code');

select is(
  (select array_agg(name order by sort) from public.project_links where project_id = '00000000-0000-4000-8000-0000000000b1'),
  array['Staging', 'Design', 'Repo'],
  'new links go to the end in insertion order'
);

select throws_ok(
  $$insert into public.project_links (project_id, name, url) values ('00000000-0000-4000-8000-0000000000b1', 'Plain', 'http://example.com')$$,
  '23514', null, 'an http link is rejected'
);
select throws_ok(
  $$insert into public.project_links (project_id, name, url) values ('00000000-0000-4000-8000-0000000000b1', 'Script', 'javascript:alert(1)')$$,
  '23514', null, 'a javascript link is rejected'
);
select throws_ok(
  $$insert into public.project_links (project_id, name, url) values ('00000000-0000-4000-8000-0000000000b1', 'Bare', 'https://')$$,
  '23514', null, 'a link without host is rejected'
);
select throws_ok(
  $$insert into public.project_links (project_id, name, url) values ('00000000-0000-4000-8000-0000000000b1', 'Spaces', 'https://exa mple.com')$$,
  '23514', null, 'a link with spaces is rejected'
);
select throws_ok(
  $$insert into public.project_links (project_id, name, url) values ('00000000-0000-4000-8000-0000000000b1', ' ', 'https://example.com/x')$$,
  '23514', null, 'a blank name is rejected'
);
select throws_ok(
  $$insert into public.project_links (project_id, name, url) values ('00000000-0000-4000-8000-0000000000b1', 'Dup', 'https://staging.example.com/')$$,
  '23505', null, 'the same url cannot be added twice to a project'
);
select lives_ok(
  $$insert into public.project_links (project_id, name, url) values ('00000000-0000-4000-8000-0000000000b2', 'Same url elsewhere', 'https://staging.example.com/')$$,
  'the same url can live in another project'
);

select lives_ok(
  $$update public.project_links set usage = 'Updated' where name = 'Design'$$,
  'the admin edits a link'
);
select lives_ok(
  $$select public.reorder_project_links('00000000-0000-4000-8000-0000000000b1', array(select id from public.project_links where project_id = '00000000-0000-4000-8000-0000000000b1' order by case name when 'Repo' then 0 when 'Staging' then 1 else 2 end))$$,
  'the admin reorders the links'
);
select is(
  (select array_agg(name order by sort) from public.project_links where project_id = '00000000-0000-4000-8000-0000000000b1'),
  array['Repo', 'Staging', 'Design'],
  'the order is stored'
);
select throws_ok(
  $$select public.reorder_project_links('00000000-0000-4000-8000-0000000000b1', array(select id from public.project_links where project_id = '00000000-0000-4000-8000-0000000000b1' limit 2))$$,
  'P0001', 'ids_mismatch', 'a partial list is rejected'
);
select throws_ok(
  $$select public.reorder_project_links('00000000-0000-4000-8000-0000000000b1', array(select id from public.project_links where project_id = '00000000-0000-4000-8000-0000000000b2' union all select id from public.project_links where project_id = '00000000-0000-4000-8000-0000000000b1' limit 3))$$,
  'P0001', 'ids_mismatch', 'links of another project are rejected'
);

reset role;
select tests.login_as('l-client@example.com');

select is((select count(*) from public.project_links), 3::bigint, 'the client reads the links of their project only');
select throws_ok(
  $$insert into public.project_links (project_id, name, url) values ('00000000-0000-4000-8000-0000000000b1', 'Mine', 'https://example.com/mine')$$,
  '42501', null, 'the client cannot add links'
);
select is(pg_temp.affected($q$update public.project_links set name = 'Hacked'$q$), 0::bigint, 'the client cannot edit links');
select is(pg_temp.affected($q$delete from public.project_links$q$), 0::bigint, 'the client cannot delete links');
select throws_ok($$select public.reorder_project_links('00000000-0000-4000-8000-0000000000b1', '{}')$$, '42501', 'forbidden', 'the client cannot reorder links');

reset role;
select tests.login_as('l-free@example.com');
select is((select count(*) from public.project_links), 3::bigint, 'the freelance reads the links of their project');

reset role;
select tests.login_as('l-client2@example.com');
select is((select count(*) from public.project_links), 1::bigint, 'another client reads only their own link');

reset role;
select tests.login_as('l-closer@example.com');
select is((select count(*) from public.project_links), 0::bigint, 'the closer reads no links');

reset role;
select is(
  (select count(*) from private.audit_log where table_name = 'project_links' and action = 'insert'),
  4::bigint,
  'link creation is audited'
);
select is(
  (select count(*) from private.audit_log where table_name = 'project_links' and action = 'update'),
  1::bigint,
  'link edits are audited and reordering is not'
);

select * from finish();

rollback;
