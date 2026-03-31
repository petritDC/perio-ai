# Performance Optimization Design — perio-ai

**Date:** 2026-03-31  
**Status:** Approved  
**Approach:** A — Database indexes + query layer fixes only (no client-side caching)  
**Scope:** All pages are slow; root causes identified across DB, query, and session layers.

---

## Problem Statement

Every URL in the app is loading slowly. After a full audit of all query files, migrations, server actions, and page components, eight concrete root causes were found. No caching layer is involved — all slowness originates in the database and query layer.

---

## Issues Found

### Issue 1 — Full table scans on `ilike` patient search
**File:** `lib/queries/patient.queries.ts` → `getPatients()`  
**File:** `lib/queries/radiology.queries.ts` → `searchPatients()`  
**Root cause:** `ilike '%x%'` on `patients.full_name`, `patients.email`, `patients.medical_record_no`, and `profiles.full_name` has no index. PostgreSQL does a sequential scan of the entire table on every keystroke.  
**Impact:** High — every `/patients` page load and radiology patient search triggers this.  
**Fix:** Enable `pg_trgm` extension and create GIN trigram indexes on all four columns.

---

### Issue 2 — Missing index on `patient_intake_submissions.status`
**File:** `lib/queries/patient.queries.ts` → `getPendingIntakeSubmissions()`  
**Migration:** `20260326000000_patient_intake.sql` — no index on `status` column  
**Root cause:** The pending intake query filters by `status = 'pending_review'` with no index. Shown on every `/patients` page load.  
**Impact:** Medium — fires on every patients list load alongside the patient query.  
**Fix:** Add `CREATE INDEX` on `patient_intake_submissions(status)` where status = 'pending_review'.

---

### Issue 3 — Separate single-column indexes instead of composite on `patients`
**Migration:** `20260326000001_patients.sql`  
**Root cause:** `patients` has separate indexes on `(full_name)`, `(status)`, `(created_at desc)` but the list query filters by `status` AND sorts by `created_at`. PostgreSQL can't efficiently combine two single-column indexes for this pattern.  
**Impact:** Medium — affects all sorted/filtered patient list loads.  
**Fix:** Add composite index `patients(status, created_at DESC)`.

---

### Issue 4 — `getSession()` not memoized, creates new Supabase client per call
**File:** `lib/auth/session.ts`  
**Root cause:** `getSession()` calls `createClient()` → `cookies()` → `supabase.auth.getUser()` on every invocation. It is called by `requireRole()` and separately by page components and server actions. In the patient profile page alone, it is called twice (once in `Promise.all`, once inside `getSession` via `requireRole` in charting actions).  
**Impact:** High — every protected page fires at least 2 auth network round-trips.  
**Fix:** Wrap `getSession` with React `cache()` so it executes once per request.

---

### Issue 5 — `getChart()` makes 2 sequential queries instead of 1 joined query
**File:** `lib/queries/charting.queries.ts` → `getChart()`  
**Root cause:** First queries `periodontal_charts`, then separately queries `chart_teeth` with `.eq('chart_id', chartId)`. These are sequential — the teeth query cannot start until the chart query completes.  
**Impact:** High — fires on every charting page, patient profile charting tab, and AI diagnosis generation.  
**Fix:** Replace with `select('*, chart_teeth(*)')` and map the result in one pass.

---

### Issue 6 — Patient profile page has a sequential waterfall for intake data
**File:** `app/(dashboard)/patients/[id]/page.tsx`  
**Root cause:** `Promise.all([getPatient(id), ...])` resolves, then `getPatientIntakeData(patient?.intake_submission_id)` is called sequentially. The intake query cannot start until the patient query completes, adding a full extra round-trip on every patient profile load.  
**Impact:** High — every `/patients/[id]` load has this waterfall.  
**Fix:** Add `getPatientWithIntake(id)` query that uses `select('*, patient_intake_submissions(*)')` on the FK, eliminating the sequential fetch.

---

### Issue 7 — `getPatientDiagnoses` fetches heavy columns for list view
**File:** `lib/queries/diagnosis.queries.ts` → `getPatientDiagnoses()` and `getChartDiagnoses()`  
**Root cause:** `select('*')` fetches `raw_response` (full AI-generated text, potentially several KB) and `findings` (jsonb blob) for every row in the list. The list view renders none of these.  
**Impact:** Medium — compounds on patients with many diagnoses.  
**Fix:** Explicit column projection excluding `raw_response` and `findings` for list queries. Add a separate `getDiagnosis(id)` for the detail view.

---

### Issue 8 — `getDashboardStats` fires 8 separate COUNT queries
**File:** `lib/queries/dashboard.queries.ts` → `getDashboardStats()`  
**Root cause:** 8 separate `supabase.from(...).select('id', { count: 'exact', head: true })` calls, each a separate network round-trip to the database, even though they run in `Promise.all`. Each query has its own connection overhead.  
**Impact:** Medium — dashboard load fires 8 DB round-trips.  
**Fix:** Create a Postgres function `get_dashboard_stats()` returning all 8 counts in a single RPC call.

---

## Fixes Planned

| # | Fix | Files Changed | Type |
|---|-----|--------------|------|
| 1 | GIN trigram indexes on name/email/record columns | new migration | DB index |
| 2 | Index on `patient_intake_submissions.status` | new migration | DB index |
| 3 | Composite index `patients(status, created_at DESC)` | new migration | DB index |
| 4 | RPC `get_dashboard_stats()` function | new migration | DB function |
| 5 | Memoize `getSession()` with React `cache()` | `lib/auth/session.ts` | Query |
| 6 | Fix `getChart()` to single joined query | `lib/queries/charting.queries.ts` | Query |
| 7 | Add `getPatientWithIntake()`, remove waterfall | `lib/queries/patient.queries.ts`, `app/(dashboard)/patients/[id]/page.tsx` | Query |
| 8 | Project columns in diagnosis list queries | `lib/queries/diagnosis.queries.ts` | Query |
| 9 | Use `get_dashboard_stats` RPC in query | `lib/queries/dashboard.queries.ts` | Query |

---

## Metrics Baseline (to measure after)

Record these before deploying to compare:

| Metric | Where to measure | Target |
|--------|-----------------|--------|
| `/patients` page TTFB | Vercel logs / browser DevTools | < 300ms |
| `/patients/[id]` page TTFB | Browser DevTools Network tab | < 400ms |
| `/schedule` page TTFB | Browser DevTools Network tab | < 300ms |
| `/dashboard` page TTFB | Browser DevTools Network tab | < 300ms |
| `getPatients()` query time | Supabase Dashboard → Query Performance | < 20ms |
| `getChart()` query time | Supabase Dashboard → Query Performance | < 15ms |
| Patient search latency | Browser DevTools Network tab | < 100ms |
| Dashboard stats query | Supabase Dashboard → Query Performance | < 10ms |

---

## Risk Assessment

- **No client-side changes** — all fixes are in the query/DB layer
- **Migration is additive** — only adds indexes and a function, no schema changes
- **Session memoization is React-standard** — `cache()` is the documented pattern for this
- **Query changes are drop-in** — same return types, no consumer changes except the waterfall refactor
- **Reversible** — indexes can be dropped, RPC removed, `cache()` unwrapped without data loss
