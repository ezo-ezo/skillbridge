# SkillBridge — Student Skill Portfolio & Opportunity Platform

SkillBridge gives every student one living portfolio of projects, skills and credentials. Institutions **verify** the credentials, the platform **matches** verified skills to opportunities, and employers **discover** candidates they can trust.

```
Student builds portfolio → Institution verifies → Skills matched to opportunities → Employer finds verified talent
```

## Features

| Role | What they can do |
|---|---|
| **Student** | Portfolio (skills, projects, credentials, experience, achievements), verified vs self-reported skills, ranked recommendations with a match breakdown, save/apply, application tracking, analytics, public profile `/profile/:username` |
| **Institution** | Verification center (verify / reject with reason, full audit trail), student roster, skill and placement analytics |
| **Employer** | Post/edit/delete opportunities, verified-talent search with filters and match %, candidate profiles, application pipeline, hiring analytics |

Highlights: JWT auth with role-based route and API protection, transactional verification that promotes backed skills to *Verified*, a deterministic matching engine (optional AI explanation, no API key required), notifications, file uploads, loading/empty/error states, toasts and confirmation dialogs, responsive UI.

## Tech stack

React 19 · Vite · Tailwind CSS 4 · React Router · Framer Motion · Recharts · Lucide — Node.js · Express 4 · Prisma 5 · PostgreSQL · JWT · bcrypt · zod · helmet · rate limiting — deployed on **AWS** (Elastic Beanstalk · RDS PostgreSQL · S3 · Systems Manager Parameter Store · IAM).

## Architecture

```
client/ (React SPA)  ──/api──▶  server/ (Express REST API)  ──Prisma──▶  PostgreSQL
                                   ├─ routes → controllers → services (matching, completion, ai, notifications)
                                   └─ middleware: auth (JWT), role authorize, zod validate, error handler
```

```
server/src/{routes,controllers,services,middleware,utils}   server/prisma/{schema.prisma,seed.js}
client/src/{pages,components,layouts,hooks,services,context,utils}
```

In production the API also serves the built client, so the whole app is **one deployable service**.

**On AWS:**

```
Browser ──HTTP──▶ Elastic Beanstalk (Node 22, nginx → Express, serves API + built client)
                      ├─ Prisma ──▶ RDS PostgreSQL   (private subnet access: only the app's security group on :5432)
                      ├─ uploads ─▶ S3 bucket        (private; files served via 5-minute signed URLs)
                      └─ secrets ─▶ SSM Parameter Store (DATABASE_URL, JWT_SECRET as SecureString)
```

The instance runs under an IAM role limited to that one bucket and the `/skillbridge/*` parameters, so no AWS keys exist in the code or in `.env`.

## Matching engine

`score = 70% skill coverage + 15% experience fit + 15% interest fit`. Per required skill: verified = 0.8 + 0.2·proficiency, self-reported = 0.45 + 0.15·proficiency, used only in a project = 0.35, missing = 0. The response lists matched skills (with their source), missing skills and a "Why this matches you" sentence. If `OPENAI_API_KEY` is set, the sentence is AI-written; on any failure it falls back to the deterministic text.

## Database schema

UUID keys, timestamps, enums and indexes throughout. Main models: `User` (role) → `StudentProfile` / `Institution` / `Employer`; `Skill`, `StudentSkill` (proficiency, status, evidence, backing credential); `Project`, `Achievement`, `Experience`; `Credential` + `CredentialVerification` (audit trail of every submit/verify/reject); `Opportunity` + `OpportunitySkill`; `Application`, `SavedOpportunity`, `Notification`. A skill becomes *Verified* when a credential backing it is verified, and reverts to self-reported if that credential is rejected, edited or deleted.

## Getting started

Requires Node.js 18+. **No PostgreSQL install needed** — a dev script runs a real local Postgres for you.

```bash
git clone <repo-url> && cd skillbridge
npm run setup                 # install server + client, generate Prisma client
cp server/.env.example server/.env
```

Then, in three terminals:

```bash
npm run db          # 1. start local PostgreSQL on :5433 (leave running)
npm run db:push     # 2. (once) create tables, then seed demo data:
npm run seed
npm run dev:server  # 3. API on http://localhost:4000
npm run dev:client  # 4. app on http://localhost:5173
```

Already have PostgreSQL (or Neon/Supabase)? Point `DATABASE_URL` in `server/.env` at it and skip `npm run db`.

### Environment variables (`server/.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | **Required.** Long random string used to sign tokens |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `PORT`, `CLIENT_URL` | API port and allowed CORS origin(s) |
| `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL` | Optional AI match explanations |
| `S3_BUCKET`, `AWS_REGION`, `S3_URL_TTL_SECONDS` | Optional. When `S3_BUCKET` is set, uploads go to S3 (credentials from the AWS default chain: `aws configure` locally, the instance role on AWS). Unset = local disk. Signed-URL lifetime defaults to 300 s |
| `ALLOW_HTTP` | Set to `true` only when serving over plain HTTP (no certificate). Disables helmet's `upgrade-insecure-requests` and HSTS, which would otherwise stop the page loading |
| `RESEED_DEMO` | Set to `true` for **one** deploy to wipe and re-seed the demo data. Normal deploys only seed an empty database |

## Demo accounts

All demo accounts use password **`Demo@1234`** (the login page has one-click buttons).

| Role | Email |
|---|---|
| Student | `student@skillbridge.demo` (Aarav Sharma) |
| Institution | `institution@skillbridge.demo` (Sahyadri Institute of Technology) |
| Employer | `employer@skillbridge.demo` (Nimbus Labs) |

More: `institution2@`, `hr@`, `talent@skillbridge.demo`, and students `priya.nair@`, `rohan.mehta@`, `ananya.iyer@`, `kabir.singh@`, `sneha.reddy@`, `vikram.patel@`, `ishita.gupta@`, `arjun.verma@skillbridge.demo`. Seed data: 9 students, 2 institutions, 3 employers, 36 skills, 33 credentials (verified, pending, rejected), 15 projects, 13 opportunities, 16 applications. Reset any time with `npm --prefix server run db:reset`.

### Suggested demo

1. **Student**: dashboard → profile → credentials (see ✓ VERIFIED and history) → opportunities → open *Frontend Developer Intern* (92% match, explanation) → Apply → log out.
2. **Institution**: Verification Center → verify Aarav's *TypeScript Workshop* → analytics.
3. **Employer**: Find talent → skill `React` + "Verified skills only" → open a profile → post an opportunity → Applications.

## API

All routes are under `/api`; send `Authorization: Bearer <token>`. `✱` = role-restricted.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/me`, `PUT /auth/password` |
| Public | `GET /profiles/:username`, `GET /stats/public`, `GET /health` |
| Students | `GET /students/:id` (`me` allowed), `PUT /students/:id` ✱student, avatar/resume upload, `GET /skills`, `POST/PUT/DELETE /student-skills` |
| Portfolio ✱student | `POST/PUT/DELETE /projects`, `/achievements`, `/experiences`; `GET /projects/:id` |
| Credentials | `POST/PUT/DELETE /credentials` ✱student, `GET /credentials` (student / institution) |
| Verification ✱institution | `GET /verification/pending`, `GET /verification/history`, `POST /verification/:id/approve`, `POST /verification/:id/reject`, `GET /institution/students` |
| Opportunities | `GET /opportunities` (q, type, workMode, skill, sort, saved, mine), `GET /opportunities/:id`, `POST/PUT/DELETE` ✱employer, `POST /opportunities/:id/save` ✱student |
| Matching ✱student | `GET /matches`, `GET /opportunities/:id/match` |
| Applications | `POST /applications` ✱student, `GET /applications` (student/employer), `PUT /applications/:id/status` ✱employer |
| Employer ✱ | `GET /candidates` (skills, verifiedOnly, college, degree, graduationYear, minExperience, opportunityId), `GET /candidates/:id` |
| Analytics | `GET /analytics/student`, `/institution`, `/employer` (each role-restricted) |
| Notifications | `GET /notifications`, `PUT /notifications/:id/read` (`all` allowed) |

Errors are `{ "error": "message", "details": [...] }` with proper status codes (400 validation, 401, 403, 404, 409 conflict, 429 rate limit).

## Security

bcrypt password hashing · JWT with server-side user lookup on every request · role checks on every route and ownership checks on every record · zod validation · helmet + CSP · CORS allow-list · rate limits (global and stricter on auth) · upload type/size limits · login errors don't reveal whether an email exists · the public profile and employer views expose verified credentials only.

## Tests

```bash
npm test      # 18 integration tests against the seeded DB (auth, RBAC, verification flow, matching, privacy)
```

The suite creates and cleans up its own records but may leave demo applications; run `npm run seed` afterwards to restore a pristine demo state.

## Deployment

### AWS (Elastic Beanstalk + RDS + S3)

This is how the demo is deployed. Region `ap-south-1`; everything is tagged `Project=skillbridge`.

| Piece | Service | Notes |
|---|---|---|
| App + client | Elastic Beanstalk, Node 22, single instance | `Procfile` runs `npm --prefix server start`; `.ebextensions/01_server.config` installs server deps, runs `prisma db push` and `scripts/seed-if-empty.js` on each deploy |
| Database | RDS PostgreSQL 16, `db.t4g.micro` | Not publicly accessible; its security group admits only the app's security group on 5432 |
| Uploads | S3 bucket | Private, public access blocked, encrypted; `GET /uploads/:file` redirects to a short-lived signed URL |
| Secrets | SSM Parameter Store (SecureString) | `/skillbridge/DATABASE_URL`, `/skillbridge/JWT_SECRET`; injected as environment secrets |
| Access | IAM instance role | Read/write on the one bucket, read on `/skillbridge/*` parameters |

**Deploy a new version**
```bash
npm run build                                   # builds client/dist
# zip: package.json, Procfile, .ebextensions/, client/dist/, server/ (without node_modules, uploads, .env)
# upload the zip to the Elastic Beanstalk S3 bucket, then:
aws elasticbeanstalk create-application-version --application-name skillbridge --version-label vN --source-bundle S3Bucket=<bucket>,S3Key=<key>
aws elasticbeanstalk update-environment --environment-name skillbridge-prod --version-label vN
```
Build the zip with forward-slash entry names (for example with .NET's `ZipArchive` or `zip`); the Windows `tar -a` zip is rejected by Beanstalk as an invalid zip.

**Reset the demo data:** deploy once with the environment property `RESEED_DEMO=true`, then remove the property. Redeploys without it never touch existing data.

**Tear down** (stops all charges for this app):
```bash
aws elasticbeanstalk terminate-environment --environment-name skillbridge-prod
aws rds delete-db-instance --db-instance-identifier skillbridge-db --skip-final-snapshot
```
Then delete the S3 bucket, the `/skillbridge/*` parameters, the security groups and the IAM role/instance profile if you no longer need them.

**Current limits:** the demo is served over plain HTTP (set `ALLOW_HTTP=true`); HTTPS needs a certificate, for example CloudFront or an Application Load Balancer with an ACM certificate. The demo accounts use a published password, so seed them only on demo deployments.

### Other hosts

The app is one Node service plus PostgreSQL, so it also runs on Render, Railway or Fly.io:
```bash
npm run build                     # builds client/dist
# set DATABASE_URL, JWT_SECRET, NODE_ENV=production on the host
npm --prefix server exec prisma db push
npm start                         # Express serves API + client on $PORT
```

**Docker.** `docker compose up --build` starts PostgreSQL + the app on http://localhost:4000; load demo data with `docker compose exec app node prisma/seed.js`. *(The Docker files were written but not run in the development environment.)*

**File uploads** use S3 when `S3_BUCKET` is set and local disk (`server/uploads`) otherwise; see `server/src/services/storage.js`. Local disk is fine for development but not for hosts with ephemeral or multiple instances.

## Future scope

Email verification and password reset, institution-side bulk import, credential verification via issuer APIs/QR, HTTPS with a custom domain, pagination for large result sets, and recommendation emails.
