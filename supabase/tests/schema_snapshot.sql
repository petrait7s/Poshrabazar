-- Prints a stable description of the public schema (used to prove that rollbacks restore the original state).
select line from (
  select 'table ' || table_name as line from information_schema.tables where table_schema = 'public'
  union all select 'column ' || table_name || '.' || column_name || ' ' || data_type || ' ' || is_nullable || ' ' || coalesce(column_default, '') from information_schema.columns where table_schema = 'public'
  union all select 'enum ' || t.typname || ' = ' || string_agg(e.enumlabel, ',' order by e.enumsortorder) from pg_type t join pg_enum e on e.enumtypid = t.oid join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' group by t.typname
  union all select 'function ' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ') ' || md5(pg_get_functiondef(p.oid)) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'
  union all select 'trigger ' || c.relname || '.' || tg.tgname from pg_trigger tg join pg_class c on c.oid = tg.tgrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and not tg.tgisinternal
  union all select 'policy ' || tablename || '.' || policyname || ' ' || cmd from pg_policies where schemaname = 'public'
  union all select 'index ' || indexname from pg_indexes where schemaname = 'public'
  union all select 'constraint ' || conrelid::regclass || '.' || conname from pg_constraint where connamespace = 'public'::regnamespace
) x order by line;
