-- Reverts 20261121000002_pivot_orders_finance.sql
drop function if exists confirm_delivery(uuid);
drop function if exists cancel_sub_order(uuid);
drop function if exists advance_fulfilment(uuid, fulfilment_status);
drop function if exists set_fulfilment_status(uuid, fulfilment_status, boolean);
drop function if exists settle_sub_order(uuid);
drop function if exists recompute_statuses(uuid);
drop function if exists place_order_v2(jsonb, text, text, text, smallint, payment_method, text);

drop table if exists ledger_entries;
drop table if exists ledger_accounts;
drop table if exists line_financials;
drop table if exists fulfilments;
drop table if exists order_lines;
drop table if exists sub_orders;
drop function if exists can_see_sub_order(uuid);
drop function if exists ledger_account(ledger_account_kind, uuid);
drop function if exists ledger_entries_immutable();
drop function if exists commission_rule_for(txn_type, smallint, timestamptz);
drop table if exists commission_rules;
drop function if exists compute_line_financials(integer, integer, integer, commission_base);

alter table orders drop column if exists ship_upazila_id, drop column if exists model_version;

drop type if exists ledger_account_kind;
drop type if exists commission_base;
drop type if exists delivery_method;
drop type if exists fulfilment_status;
drop type if exists txn_type;
