# blood-test-tracker

A full-stack application for uploading, parsing, and tracking blood test results over time, with biomarker trend visualization and automatic abnormal-value flagging against lab reference ranges.

**Status: feature-complete and working end-to-end locally. Deployment is the only remaining step.**

---

## What it does

Register, log in, upload a blood test PDF and have it automatically parsed into structured biomarker data, review and confirm (or correct) what was extracted, log manual entries with one or many biomarkers at once (home blood pressure, glucose, anything without a lab PDF), browse how any biomarker has trended over time with abnormal values clearly flagged against reference ranges, export your full history as a CSV, and delete your account and every associated record permanently if you choose to.

---

## Stack

**Backend:** FastAPI, PostgreSQL, SQLAlchemy + Alembic migrations, JWT auth (bcrypt password hashing), a custom Redis-backed sliding-window-log rate limiter (an extended, pluggable-key version of the standalone [redis-rate-limiter](https://github.com/SiddhantGupta3112/redis-rate-limiter) project), pdfplumber-based PDF parsing, Docker Compose.

**Frontend:** React 19 + TypeScript + Vite, Tailwind CSS v4, React Router, Recharts for biomarker trend charts, lucide-react for icons. Built and iterated with Google AI Studio; every API integration verified by hand against the real backend rather than assumed correct.

---

## Repository structure

```
blood-test-tracker/
├── backend/
│   ├── app/
│   │   ├── api/          # route handlers (auth, pdf, plots)
│   │   ├── core/          # config, security (JWT, bcrypt)
│   │   ├── crud/          # database read/write functions
│   │   ├── limiter/       # rate limiter (dependency + Redis client)
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── services/      # PDF parsing, metadata extraction
│   │   └── main.py
│   ├── alembic/            # migrations
│   ├── docker-compose.yml
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/     # Layout, BiomarkerChart, ConfirmationModal, ComingSoonModal
    │   ├── pages/            # Login, Register, Reports, ReportDetail, Biomarkers, AddManualEntry, UploadPDF, Profile
    │   ├── api.ts             # all backend API calls
    │   ├── types.ts           # TypeScript types mirroring the backend's Pydantic schemas
    │   └── utils.ts
    └── package.json
```

---

## Architecture

```
React (Vite)                     FastAPI                              PostgreSQL
  |                                 |                                      |
  |-- POST /auth/register --------->|-- create_new_user ------------------>|
  |-- POST /auth/login ------------>|-- verify + issue JWT ----------------|
  |-- DELETE /auth/me ------------->|-- delete user, CASCADE deletes ----->|
  |                                 |   every report + result              |
  |-- POST /pdf/upload ------------>|-- parse PDF, save file ------------->|
  |-- POST /pdf/validate/{id} ----->|-- confirm parsed data, verify ------>|
  |-- PATCH /reports/{id}/edit ---->|-- persist an edit to a report ------>|
  |-- POST /pdf/standalone -------->|-- manual entry, 1+ biomarkers ------>|
  |-- GET /pdf/reports ------------>|-- list summaries -------------------->|
  |-- GET /plots/history/{test} --->|-- one biomarker's time series ------->|
  |-- GET /plots/report/{id} ------>|-- full report detail ---------------->|
```

JWT auth (`Authorization: Bearer <token>`), token persisted in `localStorage`. A separate `/auth/swagger-login` endpoint exists purely so FastAPI's auto-generated Swagger UI has a working "Authorize" button (it requires `OAuth2PasswordRequestForm`, a different shape than the JSON-body `/auth/login` the real frontend uses) — both routes share one `_authenticate_user` helper so their logic can't drift apart.

---

## The report verification lifecycle

Every report has a `status`: `unverified` → `pending` → `verified`.

- **`unverified`** — a freshly parsed PDF. Regex-based extraction from unstructured text is inherently imperfect, so nothing is trusted until a human confirms it.
- **`pending`** — a report explicitly flagged for later review (one-directional: only `unverified → pending`).
- **`verified`** — either a human confirmed a parsed report via `POST /pdf/validate/{id}`, or the entry was created as a standalone manual entry, which skips the review workflow entirely since there was never an unreliable extraction step to distrust in the first place.

**Unverified data is excluded from biomarker trend history and the test-name list at the query level**, not just visually flagged — an unconfirmed, possibly-misread number should never silently appear on a health trend chart.

---

## Design decisions worth knowing

**Manual entries reuse the exact same `Report` → `TestResult` structure as PDF uploads.** No new tables were needed to support multi-biomarker manual entries (e.g. logging a home blood pressure reading as two related values, systolic and diastolic, under one entry with one shared date) — a `Report` having many `TestResult` rows is exactly how parsed PDF uploads already worked. The only change needed was the *request schema*, from a single flat biomarker to a list:
```json
{
  "file_name": "Home Blood Pressure",
  "collection_date": "2026-07-08",
  "lab_name": "Home Device",
  "biomarkers": [
    { "test_name": "Systolic", "value": 120, "unit": "mmHg", "lower_bound": 90, "upper_bound": 130 },
    { "test_name": "Diastolic", "value": 80, "unit": "mmHg", "lower_bound": 60, "upper_bound": 85 }
  ]
}
```

**Account deletion needed almost no application logic.** `DELETE /auth/me` deletes the authenticated user's row; every `Report` and, transitively, every `TestResult` belonging to them is removed automatically via `ON DELETE CASCADE`, configured once at the database level. The route itself is a single `db.delete(user)` call. The frontend requires typing the account's own email into a confirmation modal (`ConfirmationModal.tsx`) before the delete button is even enabled, given how irreversible this action is.

**Two-factor authentication is presented honestly as unavailable, not as a broken control.** There is no backend support for 2FA. Rather than a toggle that silently does nothing, the frontend uses a dedicated `ComingSoonModal.tsx` so the UI never implies a feature works when it doesn't.

**`get_current_user` re-checks the database on every request, not just the JWT signature.** A cryptographically valid, unexpired token only proves it was issued by this server — it says nothing about whether that user still exists. Since account deletion is now a real feature, this matters concretely: a deleted account's still-valid old token is correctly rejected because the second lookup finds no matching row.

**N+1 queries are avoided in the reports list** via a single query using an outer join plus `GROUP BY`/`COUNT`, computing every report's test count in the same round-trip that fetches the reports themselves, rather than one extra query per report.

---

## Known limitations

- **The rate limiter's two documented algorithmic gaps apply here too** (non-atomic operation sequence across its four Redis calls; a rare same-millisecond counting edge case) — both are explained in full in the standalone [redis-rate-limiter](https://github.com/SiddhantGupta3112/redis-rate-limiter) project. Accepted as-is at this project's scale (protecting login/upload endpoints from abuse), not fixed in either project.
- **CSV export is assembled client-side** from data already fetched via existing endpoints, not served by a dedicated export endpoint — a deliberate, reasonable choice rather than a shortcut awaiting a fix.
- **PDF parsing is regex-based and inherently heuristic** — different labs format reports differently, and no fixed pattern can perfectly parse every layout. This is precisely why the review/verification workflow exists as a first-class part of the design rather than an afterthought.
- **CORS origins were configured only once the frontend had a real deployed URL** — see Deployment below.
- The frontend's `package.json` carries a few unused dependencies (`@google/genai`, `express`, `dotenv`, `tsx`) left over from Google AI Studio's default project scaffold — none are imported or used anywhere in `src/`, and `GEMINI_API_KEY` in `.env.example` is likewise unused; this app makes no calls to Gemini or any LLM. Safe to remove in a future cleanup pass, not required for correctness.

---

## Planned features (not yet built)

1. Custom reference ranges — override default lab bounds per user or per test.
2. Bulk upload — multiple PDFs in one action.
3. Re-upload / replace a report whose PDF was parsed poorly, without a full delete-and-reupload.
4. Email alerts on a newly flagged abnormal result, and reminders for reports left unverified.
5. Real two-factor authentication and password/email change endpoints.

---

## Running locally

```bash
git clone https://github.com/SiddhantGupta3112/blood-test-tracker.git

cd blood-test-tracker/backend
cp .env.example .env
docker compose up

# in a second terminal
cd ../frontend
cp .env.example .env   # set VITE_API_BASE_URL to the backend's URL, e.g. http://localhost:8000
npm install
npm run dev
```

---

## Security notes

- Passwords hashed with bcrypt; JWTs signed with HS256 using standard registered claims (`iss`, `sub`, `exp`, `iat`).
- Login and upload endpoints are rate-limited (5 login attempts / 60s per IP, 10 uploads / 60s per authenticated user).
- Every report/result lookup is scoped to the requesting user's `user_id`, preventing cross-account access via ID guessing.
- Destructive actions (account deletion) require typed confirmation in the UI in addition to backend auth, not relied on as the only safeguard.