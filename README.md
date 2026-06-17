# Blood Test Tracker

A backend system for parsing blood test lab reports (PDF) into structured, time-series biomarker data. Upload a report, review and correct the extracted values, and track trends across multiple tests over time — including automatic flagging of out-of-range results.

---

## What it does

A user uploads a PDF lab report. The backend parses it with a regex-based extraction engine, returning the detected biomarkers for review. The user confirms or corrects this data before it's saved permanently — nothing is treated as ground truth until explicitly verified. Once verified, results can be queried as time series per biomarker, with abnormal values flagged automatically based on the reference ranges in the report.

Manual entry is also supported for users without a PDF report — for example, a home glucometer reading.

---

## Tech stack

FastAPI, PostgreSQL, SQLAlchemy, Alembic, Redis, Docker and Docker Compose, JWT authentication (PyJWT, bcrypt), pdfplumber for PDF text extraction.

---

## Architecture decisions

**Flush in CRUD, commit in service.** Every CRUD function uses `db.flush()` rather than `db.commit()` — the calling service or route owns the transaction boundary and commits once, after every step in a multi-part operation succeeds. This was not the original design: an early version had `create_report` commit immediately, which meant a parsing failure partway through `save_report` left an orphaned, empty report record in the database with no way to roll it back. Moving the commit to the outer service fixed this and made every multi-step write genuinely atomic.

**Wipe-and-replace validation, not patch-in-place.** When a user submits corrected data, the backend deletes all existing `TestResult` rows for that report and inserts the submitted set fresh, rather than trying to match and update individual rows. This avoids a class of bugs around partial updates and stale rows, at the cost of being slightly more expensive — an acceptable trade for a report-sized dataset.

**Every query is scoped to the requesting user.** Reports, results, and biomarker history are never fetched by ID alone — every query filters on `user_id` as well, preventing one user from accessing another user's data by guessing or incrementing an ID (an insecure direct object reference).

**Three-state report lifecycle.** Reports move through `unverified -> pending -> verified`. A report is `unverified` immediately after parsing, `pending` once a user opens it for review, and `verified` once they confirm the final data. Only verified reports appear in trend and plot queries.

**`is_abnormal` is computed and stored at write time, not derived on read.** Each result's abnormal flag is calculated once, when the data is saved, rather than recalculated every time it's queried. This keeps read queries cheap and keeps the abnormal-detection logic in one place, tested independently of the API layer.

**N+1 query elimination.** The reports list endpoint originally queried the result count separately for every report in a loop. It now uses a single query with a join and `COUNT`, returning every report and its result count in one round trip regardless of how many reports exist.

**Rate limiting differs by endpoint, deliberately.** Login is rate-limited by IP address, since there's no authenticated user yet at that point. Upload is rate-limited by user ID extracted from the JWT, since IP-based limiting is too coarse once a user is authenticated — multiple users behind the same network IP shouldn't share a limit.

---

## Running it

```bash
git clone <repo-url>
cd blood-test-tracker/backend
cp .env.example .env
docker compose up --build
```

That's the entire setup. The app container runs an entrypoint script that applies all Alembic migrations before starting the server, so a completely fresh database is brought up to the latest schema automatically — no manual migration step required, whether running locally for the first time or deploying fresh.

The API is available at `http://localhost:8000`, with interactive docs at `http://localhost:8000/docs`.

---

## API overview

| Endpoint | Method | Description |
|---|---|---|
| `/auth/register` | POST | Create a new account |
| `/auth/login` | POST | Authenticate, returns a JWT |
| `/auth/me` | GET | Current user's profile |
| `/pdf/upload` | POST | Upload a PDF report for parsing |
| `/pdf/validate/{report_id}` | POST | Submit corrected data, mark report verified |
| `/pdf/standalone` | POST | Manually log a single test result |
| `/pdf/reports` | GET | List all reports for the current user |
| `/pdf/reports/{report_id}` | PATCH | Update report status (unverified to pending) |
| `/pdf/reports/{report_id}` | DELETE | Delete a report and its results |
| `/plots/tests` | GET | List distinct biomarker names with verified data |
| `/plots/history/{test_name}` | GET | Time series of one biomarker across all reports |
| `/plots/report/{report_id}` | GET | All results for a single report |

---

## Known limitations

**Lab name extraction is best-effort.** The parser checks the first line of a report's first page for known lab-related keywords. Reports where the lab name is embedded in a background image or watermark rather than extractable text will not be detected, and the field is left for the user to fill in manually during review.

**The regex-based parser can produce false positives.** Table header or legend rows that happen to match the value-extraction pattern can occasionally be parsed as if they were a real result — for example, a reference-range legend line like `"HbA1c in % | 4.0-5.6 | 5.7-6.4 | >="` has been observed coming through as a spurious row. This is exactly why the review-and-correct step exists before any data is saved permanently — the user is expected to discard rows like this during validation.

**The Redis rate limiter is not atomic under high concurrency.** The sliding window check executes as four sequential Redis commands rather than a single atomic Lua script. Two simultaneous requests for the same key can theoretically both be counted as under the limit when together they exceed it. Acceptable for the traffic this application expects; would need to be addressed before use at meaningful scale.

**Test coverage is partial, not exhaustive.** The automated suite covers authentication flows, upload validation (auth enforcement, content-type rejection, successful parsing), and the abnormal-value detection logic across ten boundary cases. Full end-to-end coverage of the validate -> plot -> delete sequence, and negative-path tests on the validation endpoint (cross-user access attempts, malformed payloads), are a known gap rather than an oversight.