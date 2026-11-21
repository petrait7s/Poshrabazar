create schema if not exists t;
grant usage on schema t to anon, authenticated;
create table if not exists t.ids (name text primary key, id uuid not null);
grant select on t.ids to anon, authenticated;
create table if not exists t.nums (name text primary key, n bigint not null);
grant select on t.nums to anon, authenticated;
create or replace function t.num(k text) returns smallint language sql stable as $$ select x.n::smallint from t.nums x where x.name = k $$;
create or replace function t.id(k text) returns uuid language sql stable as $$ select x.id from t.ids x where x.name = k $$;
create or replace function t.as_user(k text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', t.id(k)::text, true); execute 'set local role authenticated'; end $$;
create or replace function t.as_anon() returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '', true); execute 'set local role anon'; end $$;
create or replace function t.as_service() returns void language plpgsql as $$
begin execute 'reset role'; perform set_config('request.jwt.claim.sub', '', true); end $$;
create or replace function t.ok(cond boolean, msg text) returns void language plpgsql as $$
begin if cond is distinct from true then raise exception 'TEST FAILED: %', msg; end if; end $$;
create or replace function t.eq(actual anyelement, expected anyelement, msg text) returns void language plpgsql as $$
begin if actual is distinct from expected then raise exception 'TEST FAILED: % (expected %, got %)', msg, expected, actual; end if; end $$;
create or replace function t.fails(q text, pat text, msg text) returns void language plpgsql as $$
declare m text;
begin
  begin execute q;
  exception when others then
    get stacked diagnostics m = message_text;
    if m ilike '%' || pat || '%' then return; end if;
    raise exception 'TEST FAILED: % (error was "%", expected something like "%")', msg, m, pat;
  end;
  raise exception 'TEST FAILED: % (expected an error like "%")', msg, pat;
end $$;
-- statement must change exactly n rows (RLS hides rows silently, so errors are not the only denial)
create or replace function t.affects(q text, n int, msg text) returns void language plpgsql as $$
declare c int;
begin execute q; get diagnostics c = row_count; if c <> n then raise exception 'TEST FAILED: % (expected % rows, got %)', msg, n, c; end if; end $$;
-- build the p_items array
create or replace function t.item(listing text, qty numeric, pickup text default null) returns jsonb language sql stable as $$
  select jsonb_build_object('listing_id', t.id(listing), 'qty', qty, 'pickup_point_id', case when pickup is null then null else t.id(pickup) end)
$$;
