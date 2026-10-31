#!/usr/bin/env bash
# 로컬 Postgres(16+)에서 004~ 마이그레이션과 권한 테스트를 돌린다.
# 사용: PGHOST=/var/run/postgresql PGPORT=5432 PGUSER=postgres bash supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/.."
P="psql -q -v ON_ERROR_STOP=1"
DB=bleset_test
$P -d postgres -c "drop database if exists $DB" -c "create database $DB"
$P -d $DB -f tests/00-supabase-stub.sql
for f in 001_saves.sql 002_invites.sql; do $P -d $DB -f $f; done
sed -n '1,/^-- 2)/p' 003_admin.sql | sed '$d' | $P -d $DB
for f in 0[0-9][0-9]_*.sql; do case $f in 00[123]_*) ;; *) $P -d $DB -f "$f";; esac; done 2>&1 | grep -v NOTICE || true
$P -d $DB -f tests/rls-test.sql 2>&1 | grep -E 'OK|FAIL|ERROR|PASSED' | sed 's/^psql:[^ ]* //; s/NOTICE:  //'
