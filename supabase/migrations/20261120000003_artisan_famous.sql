-- Regional specialty products (sweets, doi, shutki, tea, saree, crafts) sold nationwide.
alter type seller_kind add value if not exists 'artisan';

-- District a product is famous for (shown as a "বগুড়ার বিখ্যাত" badge).
alter table products add column if not exists famous_district_id smallint references districts(id);
create index if not exists products_famous_idx on products(famous_district_id) where famous_district_id is not null;

-- Offers from sellers that ship nationwide are visible in every area.
-- (the app filters: seller in chosen area OR product famous AND seller.serves_nationwide)

create or replace view product_cards with (security_invoker = on) as
  select p.id as product_id, p.slug, p.name_bn, p.name_en, p.unit_bn, c.slug as category_slug, p.image_url,
         min(l.retail_paisa) as min_retail_paisa, min(l.wholesale_paisa) as min_wholesale_paisa,
         count(l.offer_id)::int as seller_count, coalesce(bool_or(l.seller_verified), false) as any_verified,
         p.famous_district_id
  from products p
  join categories c on c.id = p.category_id
  left join offer_listing l on l.product_id = p.id
  where p.active
  group by p.id, c.slug;
