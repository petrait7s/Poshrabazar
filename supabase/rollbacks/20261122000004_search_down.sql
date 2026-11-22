drop function if exists search_listings(text, smallint, smallint, smallint, uuid, boolean, int, int), search_stores(text, smallint, int, int);
drop index if exists products_name_trgm, stores_name_trgm;
drop extension if exists pg_trgm;
