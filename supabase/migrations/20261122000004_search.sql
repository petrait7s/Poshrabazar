-- PosraBazar migration 7/7: catalogue and store search (product, category, store, origin district/upazila, retail/wholesale).
-- Functions run as the caller, so row level security decides what is visible (public, active listings of published stores only).
-- Rollback: rollbacks/20261122000004_search_down.sql
create extension if not exists pg_trgm;

create index products_name_trgm on products using gin ((coalesce(name_bn, '') || ' ' || coalesce(name_en, '')) gin_trgm_ops);
create index stores_name_trgm   on stores   using gin ((coalesce(name_bn, '') || ' ' || coalesce(name_en, '')) gin_trgm_ops);

create or replace function search_listings(
  p_q text default null, p_category smallint default null, p_origin_district smallint default null, p_origin_upazila smallint default null,
  p_store uuid default null, p_wholesale boolean default null, p_limit int default 40, p_offset int default 0
) returns table (
  listing_id uuid, store_id uuid, product_id uuid, product_name_bn text, store_name_bn text, category_id smallint,
  origin_district_id smallint, origin_upazila_id smallint, min_price_paisa integer, has_wholesale boolean, available numeric, rank real
) language sql stable set search_path = public as $$
  select l.id, l.store_id, l.product_id, p.name_bn, s.name_bn, p.category_id, l.origin_district_id, l.origin_upazila_id,
         (select min(unit_price_paisa) from price_tiers t where t.listing_id = l.id),
         exists (select 1 from price_tiers t where t.listing_id = l.id and t.is_wholesale),
         listing_available(l.id),
         case when nullif(trim(p_q), '') is null then 0::real
              else greatest(similarity(p.name_bn || ' ' || coalesce(p.name_en, ''), p_q), similarity(s.name_bn || ' ' || coalesce(s.name_en, ''), p_q)) end
    from listings l
    join products p on p.id = l.product_id
    join categories c on c.id = p.category_id and c.active
    join stores s on s.id = l.store_id
    left join districts od on od.id = l.origin_district_id
    left join upazilas ou on ou.id = l.origin_upazila_id
   where l.status = 'active'
     and (p_category is null or p.category_id = p_category)
     and (p_origin_district is null or l.origin_district_id = p_origin_district)
     and (p_origin_upazila is null or l.origin_upazila_id = p_origin_upazila)
     and (p_store is null or l.store_id = p_store)
     and (p_wholesale is null or exists (select 1 from price_tiers t where t.listing_id = l.id and t.is_wholesale) = p_wholesale)
     and (nullif(trim(p_q), '') is null
          or p.name_bn ilike '%' || trim(p_q) || '%' or p.name_en ilike '%' || trim(p_q) || '%'
          or c.name_bn ilike '%' || trim(p_q) || '%' or c.name_en ilike '%' || trim(p_q) || '%'
          or s.name_bn ilike '%' || trim(p_q) || '%' or s.name_en ilike '%' || trim(p_q) || '%'
          or od.name_bn ilike '%' || trim(p_q) || '%' or ou.name_bn ilike '%' || trim(p_q) || '%'
          or similarity(p.name_bn || ' ' || coalesce(p.name_en, ''), trim(p_q)) > 0.3)
   order by 12 desc, l.created_at desc
   limit least(coalesce(p_limit, 40), 100) offset greatest(coalesce(p_offset, 0), 0)
$$;
grant execute on function search_listings(text, smallint, smallint, smallint, uuid, boolean, int, int) to anon, authenticated;

create or replace function search_stores(p_q text default null, p_district smallint default null, p_limit int default 40, p_offset int default 0)
returns table (store_id uuid, slug text, name_bn text, tagline_bn text, district_id smallint, operation_mode store_operation_mode, featured boolean)
language sql stable set search_path = public as $$
  select s.id, s.slug, s.name_bn, s.tagline_bn, s.district_id, s.operation_mode, s.featured
    from stores s left join districts d on d.id = s.district_id
   where s.published and s.suspended_at is null
     and (p_district is null or s.district_id = p_district)
     and (nullif(trim(p_q), '') is null or s.name_bn ilike '%' || trim(p_q) || '%' or s.name_en ilike '%' || trim(p_q) || '%'
          or d.name_bn ilike '%' || trim(p_q) || '%' or similarity(s.name_bn || ' ' || coalesce(s.name_en, ''), trim(p_q)) > 0.3)
   order by s.featured desc, s.name_bn
   limit least(coalesce(p_limit, 40), 100) offset greatest(coalesce(p_offset, 0), 0)
$$;
grant execute on function search_stores(text, smallint, int, int) to anon, authenticated;
