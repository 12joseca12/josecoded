insert into private.jobs (id, kind, payload, status, attempts, run_after, result, error, created_at, finished_at)
values
  ('50000000-0000-4000-8000-000000000001', 'rag.index', '{"source": "prueba"}', 'done', 1, now() - interval '3 hours', '{"chunks": 12}', null, now() - interval '3 hours', now() - interval '179 minutes'),
  ('50000000-0000-4000-8000-000000000002', 'radar.scan', '{}', 'failed', 3, now() - interval '2 hours', null, 'Prueba: la fuente no responde (timeout tras 30 s)', now() - interval '2 hours', now() - interval '110 minutes'),
  ('50000000-0000-4000-8000-000000000003', 'notify.send', '{"event": "lead_new"}', 'queued', 0, now() + interval '5 minutes', null, null, now() - interval '1 minute', null),
  ('50000000-0000-4000-8000-000000000004', 'chat.summary', '{}', 'cancelled', 0, now() - interval '1 day', null, null, now() - interval '1 day', now() - interval '1 day'),
  ('50000000-0000-4000-8000-000000000005', 'radar.draft', '{}', 'failed', 3, now() - interval '30 minutes', null, 'Prueba: respuesta del modelo vacía', now() - interval '40 minutes', now() - interval '20 minutes');
