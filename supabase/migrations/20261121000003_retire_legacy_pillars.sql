-- PosraBazar pivot, migration 3/3: retire tables that belonged to removed product pillars
-- (Khata Lite ledger, software demo requests). No production data exists for these.
-- Rollback recreates the exact structures: rollbacks/20261121000003_retire_legacy_pillars_down.sql
drop table if exists khata_entries;
drop table if exists demo_requests;
drop type  if exists khata_type;
