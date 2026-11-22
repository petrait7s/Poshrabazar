#!/usr/bin/env bash
# Database tests. Needs a reachable PostgreSQL 15+ (PGHOST/PGPORT/PGUSER/PGPASSWORD as usual) and permission to create databases.
#   npm run db:test
# Steps: (0) -, (1) apply all migrations to a scratch DB and run every tests/NN_*.sql; (2) apply, then roll back the
# pivot migrations on a second DB and prove the schema is identical to the pre-pivot schema.
set -euo pipefail
cd "$(dirname "$0")/.."
export PGOPTIONS='--client-min-messages=warning'
A=pb_test_up; B=pb_test_roll
psql_() { psql -X -q -v ON_ERROR_STOP=1 "$@"; }
fresh() { psql -X -q -d postgres -c "drop database if exists $1" -c "create database $1"; }
legacy=(migrations/20261120000001_schema.sql migrations/20261120000002_security_logic.sql migrations/20261120000003_artisan_famous.sql)
pivot=(migrations/20261121000001_pivot_core.sql migrations/20261121000002_pivot_orders_finance.sql migrations/20261121000003_retire_legacy_pillars.sql migrations/20261122000001_seller_onboarding.sql migrations/20261122000002_geography_categories.sql migrations/20261122000003_delivery_ops.sql)

echo "== 1. migrations + tests"
fresh $A
psql_ -d $A -f tests/_stub.sql
for f in "${legacy[@]}" "${pivot[@]}"; do psql_ -d $A -f "$f"; done
psql_ -d $A -f tests/_helpers.sql
psql_ -d $A -f tests/_fixture.sql
fail=0
for t in tests/0*.sql; do
  if out=$(psql_ -d $A -f "$t" 2>&1); then echo "  PASS  $(basename "$t")"; else echo "  FAIL  $(basename "$t")"; echo "$out" | grep -E "ERROR|TEST FAILED|CONTEXT" | head -6 | sed 's/^/        /'; fail=1; fi
done

echo "== 2. rollback restores the pre-pivot schema"
fresh $B
psql_ -d $B -f tests/_stub.sql
for f in "${legacy[@]}"; do psql_ -d $B -f "$f"; done
psql_ -d $B -At -f tests/schema_snapshot.sql > /tmp/pb_schema_before.txt
for f in "${pivot[@]}"; do psql_ -d $B -f "$f"; done
psql_ -d $B -f rollbacks/20261122000003_delivery_ops_down.sql
psql_ -d $B -f rollbacks/20261122000002_geography_categories_down.sql
psql_ -d $B -f rollbacks/20261122000001_seller_onboarding_down.sql
psql_ -d $B -f rollbacks/20261121000003_retire_legacy_pillars_down.sql
psql_ -d $B -f rollbacks/20261121000002_pivot_orders_finance_down.sql
psql_ -d $B -f rollbacks/20261121000001_pivot_core_down.sql
psql_ -d $B -At -f tests/schema_snapshot.sql > /tmp/pb_schema_after.txt
if diff -u /tmp/pb_schema_before.txt /tmp/pb_schema_after.txt > /tmp/pb_schema.diff; then echo "  PASS  rollback restores the schema ($(wc -l < /tmp/pb_schema_before.txt) objects compared)"; else echo "  FAIL  schema differs after rollback"; head -40 /tmp/pb_schema.diff; fail=1; fi
# re-apply after rollback proves the migrations are repeatable
for f in "${pivot[@]}"; do psql_ -d $B -f "$f"; done && echo "  PASS  migrations re-apply after rollback"

echo "== 3. seed loads on the final schema"
fresh $A
psql_ -d $A -f tests/_stub.sql
for f in "${legacy[@]}" "${pivot[@]}"; do psql_ -d $A -f "$f"; done
psql_ -d $A -f seed.sql
cnt=$(psql -X -At -d $A -c "select (select count(*) from upazilas) || ' upazilas, ' || (select count(*) from categories) || ' categories, ' || (select count(*) from products) || ' products'")
echo "  PASS  seed loaded: $cnt"

psql -X -q -d postgres -c "drop database if exists $A" -c "drop database if exists $B"
exit $fail
