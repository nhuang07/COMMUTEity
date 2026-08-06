# Commutity — Build Day Task Breakdown

**Event:** UBC × CIC Summer 2026 Hackathon  
**Build window:** ~6.5 hours (includes buffer for demo rehearsal)  
**Team:** 3 engineers — Frontend (FE), Backend (BE), Infrastructure (INFRA)

---

## Timeline Overview

| Block | Time | Focus |
|-------|------|-------|
| 0 | 0:00–0:30 | All-hands: API contract, DynamoDB schema, WebSocket message formats |
| 1 | 0:30–2:30 | Parallel build — FE on mocks, BE on Lambda logic, INFRA on AWS resources |
| 2 | 2:30–3:00 | **CONVERGENCE MILESTONE** — Integration checkpoint |
| 3 | 3:00–5:00 | Integration wiring, polish, fix gaps |
| 4 | 5:00–5:30 | End-to-end demo dry-run with seeded data |
| 5 | 5:30–6:00 | Bug fixes from dry-run, final polish |
| 6 | 6:00–6:30 | Buffer / stretch features / demo rehearsal |

---

## Block 0 — All-Hands Contract Definition (0:00–0:30)

> **ALL THREE ENGINEERS TOGETHER — no one starts coding until this is done.**

### T-000: Define API contract (ALL, 30 min)

Produce a single shared document (`api-contract.md` or equivalent) that specifies:

1. **REST endpoints** (API Gateway → Lambda):
   - `POST /auth/signup` — request: `{ email, displayName, homeArea, campusDestination }` → response: `{ userId, status }`
   - `POST /auth/verify` — request: `{ email, verificationCode }` → response: `{ token }`
   - `POST /sessions` — request: `{ userId, sessionId, startTime, endTime, trail: [{ geohash, timestamp }] }` → response: `{ status: "accepted", sessionId }`
   - `GET /matches` — request: (auth header) → response: `{ matches: [{ matchId, status, explanation, createdAt }] }`
   - `POST /matches/:matchId/respond` — request: `{ decision: "accept" | "decline" }` → response: `{ matchId, status }`
   - `GET /connections` — request: (auth header) → response: `{ connections: [{ connectionId, displayName, faculty, year, socials, explanation }] }`
   - `GET /profile` / `PUT /profile` — profile CRUD

2. **WebSocket messages** (API Gateway WebSocket):
   - Server → Client: `{ type: "new_match", matchId, explanation }`
   - Server → Client: `{ type: "match_accepted", connectionId, profile }`

3. **DynamoDB table schemas**:
   - `Users` — PK: `userId` — attributes: displayName, email, homeArea, campusDestination, faculty, year, socials, createdAt
   - `Sessions` — PK: `userId`, SK: `sessionId` — attributes: startTime, endTime, trail (list of geohash+ts), ttl
   - `OverlapScores` — PK: `pairKey` (sorted userId pair), SK: `computedAt` — attributes: score, sessionCount, sharedWindow, explanation, status
   - `MatchDecisions` — PK: `matchId`, SK: `userId` — attributes: decision, decidedAt

4. **Auth token format**: Cognito JWT in `Authorization: Bearer <token>` header on all authenticated endpoints.

**Output:** Committed `api-contract.md` in repo root. All three sign off verbally before splitting.

---

## Block 1 — Parallel Build (0:30–2:30)

---

### FRONTEND WORKSTREAM (FE)

All FE tasks use **hardcoded mock data** matching the API contract shapes. No real network calls yet.

#### T-FE-01: Project scaffolding & navigation (20 min)

- Install dependencies: `expo-router`, `expo-location`, `react-native-maps` (or `expo` map equivalent), `nativewind` or basic StyleSheet
- Set up file-based routing with expo-router
- Define 5 route screens: `/onboarding`, `/home`, `/commute`, `/match-reveal/[id]`, `/connection/[id]`
- Add a simple tab navigator: Home, Connections, Settings
- **Refs:** FR-05, FR-31

#### T-FE-02: Onboarding screen (25 min)

- Three input fields: display name, home area (text input), campus destination (picker: UBC Vancouver / UBC Okanagan)
- Submit button → validates non-empty → navigates to Home
- Wired to mock: simulates Cognito sign-up + verify flow with a 2-second delay
- **Refs:** FR-01 through FR-04

#### T-FE-03: Home screen with Start/End Commute button (25 min)

- Large "Start Commute" button (primary state)
- On tap → flip to "End Commute" state, start timer display (elapsed time)
- Below button: "Connections" entry point (list count badge from mock data)
- Pending match notifications shown as cards (from mock data)
- **Refs:** FR-06, FR-07, FR-31

#### T-FE-04: Active Commute screen with map (30 min)

- Request foreground location permission via `expo-location`
- Show MapView centered on user's current location with a pulsing dot
- Display elapsed time and "points collected" count
- On End Commute tap: stop location sampling, show upload confirmation, navigate back to Home
- Location sampling logic: `setInterval` at 60s, convert to geohash on-device using a geohash library (e.g., `ngeohash`), accumulate in state
- **Refs:** FR-08 through FR-14

#### T-FE-05: Match Reveal screen (20 min)

- Displays AI-generated explanation text (from mock/API)
- Two buttons: "Accept" and "Not Interested"
- On Accept → show "Waiting for them..." state
- On Not Interested → navigate back to Home with toast
- **Refs:** FR-24 through FR-27

#### T-FE-06: Connected Profile screen (15 min)

- Displays: name, faculty/year, social handles as tappable links, overlap explanation
- Simple card layout, no chat or messaging
- **Refs:** FR-28 through FR-30

#### T-FE-07: Settings / Profile screen (15 min)

- Edit display name, home area, faculty, year, social handles
- Delete account button with confirmation modal
- **Refs:** FR-32, FR-33

---

### BACKEND WORKSTREAM (BE)

All BE tasks run locally first with mock DynamoDB data (or local DynamoDB). Integration with real AWS happens after INFRA has resources live.

#### T-BE-01: Geohash utility module (20 min)

- Python module (`geohash_utils.py`) with:
  - `encode(lat, lon, precision=7) → str` (wraps a geohash library)
  - `overlap_score(trail_a, trail_b, time_window_seconds=900) → float` — counts matching geohash cells within the time window
  - `is_recurring(scores: list[float], threshold=2) → bool` — checks if cumulative overlap crosses threshold
- Unit tests with 3–4 hardcoded trail pairs (overlap, no overlap, edge case)
- **Refs:** FR-15 through FR-18

#### T-BE-02: Session upload Lambda handler (25 min)

- Accepts `POST /sessions` payload
- Validates schema (userId present, trail is list of {geohash, timestamp})
- Writes session to DynamoDB `Sessions` table with a TTL of 30 days
- Returns `202 Accepted`
- Triggers async invocation of the matching Lambda (or enqueues for it)
- **Refs:** FR-11, FR-15, NFR-02, PD-04

#### T-BE-03: Matching/Overlap Lambda (40 min)

- Triggered after session upload
- Retrieves all sessions from other users within the past 30 days
- Computes pairwise overlap score using `geohash_utils.overlap_score`
- Checks recurrence using `is_recurring`
- If threshold crossed:
  - Writes/updates `OverlapScores` record
  - Deletes contributing trail data from `Sessions` (PD-03)
  - Invokes Bedrock explanation generation (T-BE-04)
  - Sends WebSocket notification to both users
- Idempotency: checks if match already notified for this pair before re-notifying
- **Refs:** FR-15 through FR-20, PD-03

#### T-BE-04: Bedrock explanation generation (25 min)

- Lambda function (or module within matching Lambda) that:
  - Constructs a prompt with: shared timing window, approximate corridor (geohash → region name mapping), user faculty/year if available
  - Calls Bedrock (Claude) with the prompt
  - Returns 2–3 sentence natural-language explanation
  - Never includes user IDs, raw geohashes, or numerical scores in the prompt
- Test locally with a mocked Bedrock response structure
- **Refs:** FR-21, PD-09

#### T-BE-05: Match decision handler (20 min)

- `POST /matches/:matchId/respond` Lambda
- Writes decision to `MatchDecisions` table
- Checks if both users for this matchId have accepted
- If mutual: updates match status to "connected," sends WebSocket `match_accepted` to both
- If only one: no action
- If declined: flags match, no notification
- **Refs:** FR-24 through FR-27

#### T-BE-06: Connections & Profile endpoints (20 min)

- `GET /connections` — queries `OverlapScores` where status=connected, joins with `Users` table for profile data
- `GET /profile` / `PUT /profile` — basic CRUD on `Users` table
- `DELETE /profile` — removes user, sessions, match decisions, dissolves connections
- **Refs:** FR-28 through FR-33

---

### INFRASTRUCTURE WORKSTREAM (INFRA)

#### T-INFRA-01: Cognito User Pool (20 min)

- AWS CLI: create user pool with email verification, UBC email domain filter
- Create app client for the React Native app
- Document pool ID and client ID for FE/BE config
- **Refs:** FR-01, FR-02

#### T-INFRA-02: DynamoDB tables (20 min)

- AWS CLI: create tables per schema in `api-contract.md`:
  - `Users` (PK: userId)
  - `Sessions` (PK: userId, SK: sessionId) — TTL enabled on `ttl` attribute
  - `OverlapScores` (PK: pairKey, SK: computedAt) — GSI on status
  - `MatchDecisions` (PK: matchId, SK: userId)
- Set provisioned capacity to on-demand (pay-per-request) for hackathon scale
- **Refs:** T-000 schema

#### T-INFRA-03: Lambda functions — skeleton deploy (25 min)

- AWS CLI: create 4 Lambda functions with Python 3.12 runtime:
  - `commuteity-session-upload`
  - `commuteity-matching-engine`
  - `commuteity-match-respond`
  - `commuteity-profile`
- Attach IAM role with DynamoDB access, Bedrock InvokeModel, API Gateway management
- Deploy placeholder handlers (return 200 OK)
- **Refs:** T-BE-02 through T-BE-06

#### T-INFRA-04: API Gateway REST API (25 min)

- AWS CLI: create REST API with routes matching `api-contract.md`
- Integrate each route with its corresponding Lambda
- Enable Cognito authorizer on all authenticated endpoints
- Deploy to a `dev` stage
- Share base URL with FE and BE
- **Refs:** T-000 contract

#### T-INFRA-05: API Gateway WebSocket API (20 min)

- AWS CLI: create WebSocket API with:
  - `$connect` route (validates Cognito token, stores connectionId in DynamoDB or in-memory)
  - `$disconnect` route (removes connectionId)
- Backend Lambdas use `@connections` API to push messages to connected clients
- **Refs:** FR-22, FR-23

#### T-INFRA-06: Seed demo data (25 min)

- Create 2–3 demo user accounts in Cognito (with verified emails) and `Users` table
- Insert pre-computed `OverlapScores` records for one pair with score above threshold, status=pending
- Insert a pre-generated Bedrock explanation string in the overlap record
- Insert one pair already at "connected" status with full profile data
- This ensures the live demo can show: (a) a new match notification → opt-in → reveal, and (b) an existing connection profile
- **Refs:** NFR-05, US-09

#### T-INFRA-07: Expo push notification setup (15 min)

- Configure Expo push token registration in the app (FE will call this)
- Store push tokens in `Users` table
- Backend uses Expo push API as fallback when WebSocket is disconnected
- **Refs:** FR-22, FR-23

---

## Block 2 — CONVERGENCE MILESTONE (2:30–3:00)

> **CRITICAL INTEGRATION CHECKPOINT — all three engineers sync.**

### T-CONV-01: Integration smoke test (30 min)

At this point:
- INFRA has: live API Gateway base URL, deployed Lambda skeletons, DynamoDB tables created, seeded demo data
- BE has: working Lambda logic tested locally
- FE has: all 5 screens working against mock data

**Actions:**
1. BE deploys real Lambda code to the skeleton functions INFRA created
2. FE points one screen (session upload) at the real API Gateway URL
3. Team verifies round-trip: FE → API Gateway → Lambda → DynamoDB → response to FE
4. If anything fails, this is the 30-minute buffer to fix it before integration continues

**Definition of "pass":** Session upload from the FE app writes a record to DynamoDB and returns 202 to the app.

---

## Block 3 — Integration Wiring (3:00–5:00)

### FRONTEND (FE)

#### T-FE-08: Replace mock auth with real Cognito (25 min)

- Install `aws-amplify` or use Cognito REST APIs directly
- Wire onboarding screen sign-up → Cognito createUser → verify → get JWT
- Store JWT in secure storage, attach to all API calls
- **Refs:** FR-01, FR-02

#### T-FE-09: Wire session upload to real endpoint (20 min)

- Replace mock upload handler with real `POST /sessions` call
- Handle 202 response, retry logic on failure
- **Refs:** FR-11, FR-12

#### T-FE-10: Wire WebSocket connection for live notifications (25 min)

- On app start (post-auth): connect to WebSocket API Gateway URL with JWT
- Listen for `new_match` messages → show notification / navigate to Match Reveal
- Listen for `match_accepted` messages → show notification / navigate to Connection
- **Refs:** FR-22, FR-23

#### T-FE-11: Wire match decision flow (15 min)

- Accept/Decline buttons → `POST /matches/:matchId/respond`
- On mutual accept notification → navigate to Connected Profile
- **Refs:** FR-24 through FR-27

#### T-FE-12: Wire connections list & profile screens (15 min)

- `GET /connections` → render list on Home
- `GET /profile` / `PUT /profile` → Settings screen
- **Refs:** FR-28 through FR-32

### BACKEND (BE)

#### T-BE-07: Deploy real Lambda code (20 min)

- Package all Lambda handlers with dependencies
- Deploy via AWS CLI (`aws lambda update-function-code`)
- Verify each endpoint returns expected responses with curl / Postman
- **Refs:** T-INFRA-03

#### T-BE-08: WebSocket push integration (20 min)

- Implement connection tracking (store WebSocket connectionId keyed by userId)
- Matching Lambda and match-respond Lambda: post messages to `@connections` API
- Fallback: if connectionId not found, send Expo push notification
- **Refs:** FR-22, FR-23, T-INFRA-05

#### T-BE-09: End-to-end match flow test with seeded data (20 min)

- Trigger matching engine Lambda manually with a test session that overlaps seeded demo data
- Verify: overlap detected → Bedrock explanation generated → notification sent → decision recorded → mutual accept triggers profile reveal
- Fix any issues in the chain
- **Refs:** NFR-05

### INFRASTRUCTURE (INFRA)

#### T-INFRA-08: CORS and permissions sweep (15 min)

- Ensure API Gateway has CORS enabled for the Expo dev client origin
- Verify Lambda IAM roles have all needed permissions (DynamoDB, Bedrock, API Gateway execute-api)
- Test Cognito authorizer is correctly validating JWTs on protected routes

#### T-INFRA-09: Monitoring & logs (10 min)

- Enable CloudWatch Logs on all Lambdas
- Set up a basic CloudWatch alarm on Lambda errors (optional but helpful for debugging during integration)

---

## Block 4 — End-to-End Demo Dry-Run (5:00–5:30)

### T-DEMO-01: Full demo walkthrough (30 min)

Run through the exact demo script the team will present to judges:

1. **Fresh user onboarding** — sign up with UBC email, verify, land on Home
2. **Start commute** — show map, watch dot move, see geohash count increment
3. **End commute** — see upload confirmation
4. **Receive match notification** — use seeded demo data to trigger a match immediately (INFRA invokes matching Lambda manually if needed)
5. **View match explanation** — show the AI-generated text
6. **Accept match** — show "waiting" state
7. **Second user accepts** (on a second device or simulated) — both see connected profile
8. **View connection** — show name, faculty, socials

**Record issues.** Every failure gets logged with a priority: P0 (demo-breaking) or P1 (cosmetic).

---

## Block 5 — Bug Fixes (5:30–6:00)

### T-FIX-01: Fix P0 issues from demo dry-run (30 min)

- All three engineers triage P0 issues
- FE fixes UI/navigation bugs
- BE fixes Lambda logic errors
- INFRA fixes permission or configuration issues
- Re-run the broken demo step after each fix

---

## Block 6 — Buffer / Stretch / Rehearsal (6:00–6:30)

### T-STRETCH-01: (If time) TransLink GTFS route labelling (INFRA + BE)

- Only attempt if all P0s resolved and demo is clean
- INFRA: upload preprocessed GTFS shapes to S3 or DynamoDB
- BE: implement geometric distance comparison in matching Lambda
- Add route label to match explanation if confidence is high
- **Refs:** SF-01

### T-REHEARSE-01: Final demo rehearsal (ALL, 15 min minimum)

- Time the demo — aim for under 4 minutes
- Assign speaking roles (who demoes which screen)
- Prepare one-liner answers for expected judge questions:
  - "How is this different from a dating app?" → No browsing, no swiping, passive detection + mutual opt-in
  - "What about privacy?" → Raw GPS never leaves device, geohash only, trail data deleted after scoring
  - "What's the AI doing?" → Only generating the human-readable explanation, not making the match decision
  - "How do you prevent fake matches?" → Requires recurring overlap across multiple days, not one coincidence

---

## Dependency Graph (Critical Path)

```
T-000 (ALL)
  ├──► T-FE-01 → T-FE-02 → T-FE-03 → T-FE-04 → T-FE-05 → T-FE-06 → T-FE-07
  ├──► T-BE-01 → T-BE-02 → T-BE-03 → T-BE-04 → T-BE-05 → T-BE-06
  └──► T-INFRA-01 → T-INFRA-02 → T-INFRA-03 → T-INFRA-04 → T-INFRA-05 → T-INFRA-06 → T-INFRA-07
                                                                                    │
                              ┌──────────────────────────────────────────────────────┘
                              ▼
                    T-CONV-01 (ALL — 2:30 mark)
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         T-FE-08         T-BE-07         T-INFRA-08
         T-FE-09         T-BE-08         T-INFRA-09
         T-FE-10         T-BE-09
         T-FE-11
         T-FE-12
              │               │               │
              └───────────────┼───────────────┘
                              ▼
                    T-DEMO-01 (5:00 mark)
                              │
                              ▼
                    T-FIX-01 (5:30)
                              │
                              ▼
                    T-REHEARSE-01 (6:00)
```

---

## Blocking Dependencies (Explicitly Called Out)

| Blocked task | Blocked by | Resolution |
|---|---|---|
| All FE integration tasks (T-FE-08+) | T-INFRA-04 (API Gateway URL available) | FE cannot wire real calls until Gateway is deployed |
| T-BE-07 (deploy real code) | T-INFRA-03 (Lambda skeletons exist) | BE cannot deploy until INFRA has created the functions |
| T-BE-03 (matching engine) | T-BE-01 (geohash utility) | Matching logic depends on overlap scoring function |
| T-BE-04 (Bedrock explanation) | T-INFRA-03 (Lambda with Bedrock IAM) | Cannot call Bedrock without the correct IAM role attached |
| T-CONV-01 (convergence) | All Block 1 tasks in all workstreams | Checkpoint only makes sense when all three have deliverables |
| T-DEMO-01 (dry-run) | All Block 3 integration tasks | Demo requires full end-to-end wiring |
| T-FE-10 (WebSocket) | T-INFRA-05 (WebSocket API deployed) | FE needs the WebSocket URL |

---

## Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Bedrock cold start or quota delay | Pre-generate 2–3 explanation strings during seeding (T-INFRA-06). Demo can fall back to pre-seeded text if Bedrock is slow. |
| Location permission denied on demo device | Test on physical device during Block 1. Have a "simulated commute" mode that replays a hardcoded trail if permission fails. |
| WebSocket flaky on conference Wi-Fi | Fallback: polling `GET /matches` every 10 seconds during demo if WebSocket fails. |
| Integration takes longer than Block 3 | FE keeps mock-data mode as a toggle — if one screen isn't wired in time, it still "works" for the demo with mock data. |
| Time overrun | Stretch features are explicitly last. Cut them completely rather than sacrificing demo quality. |
