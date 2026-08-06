# Commutity — Design Specifications

**Project:** Commutity  
**Event:** UBC × CIC Summer 2026 Hackathon — Student Success Tools  
**Version:** 1.0 (MVP)

---

## 1. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Expo / React Native)                    │
│                                                                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Onboarding │  │   Home /   │  │   Active     │  │  Match Reveal  │  │
│  │   Screen   │  │ Connections│  │   Commute    │  │  / Connection  │  │
│  └─────┬──────┘  └─────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
│        │                │                │                   │           │
│        │         ┌──────┴────────────────┴───────────────────┘           │
│        │         │  Geohash Encoder (on-device)                          │
│        │         │  GPS → geohash level 7 conversion                     │
│        │         └──────────────┬────────────────────────────            │
└────────┼────────────────────────┼────────────────────────────────────────┘
         │ HTTPS (REST)           │ HTTPS (REST) + WSS (WebSocket)
         ▼                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      AWS API Gateway                                    │
│                                                                        │
│  ┌─────────────────────────┐    ┌──────────────────────────────────┐  │
│  │   REST API (HTTPS)      │    │   WebSocket API (WSS)            │  │
│  │   /auth/* /sessions     │    │   $connect / $disconnect         │  │
│  │   /matches/* /profile   │    │   Server → Client push           │  │
│  │   /connections          │    │                                  │  │
│  └───────────┬─────────────┘    └──────────────┬───────────────────┘  │
└──────────────┼─────────────────────────────────┼──────────────────────┘
               │ Cognito Authorizer               │
               ▼                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        AWS Lambda (Python 3.12)                        │
│                                                                       │
│  ┌──────────────────┐  ┌───────────────────┐  ┌───────────────────┐ │
│  │ session-upload    │  │ matching-engine   │  │ match-respond     │ │
│  │                   │  │                   │  │                   │ │
│  │ Validates trail   │  │ Pairwise overlap  │  │ Records decision  │ │
│  │ Writes to Dynamo  │  │ Bedrock explain   │  │ Checks mutual     │ │
│  │ Triggers matching │  │ Notifies users    │  │ Triggers reveal   │ │
│  └──────────────────┘  └───────────────────┘  └───────────────────┘ │
│                                                                       │
│  ┌──────────────────┐  ┌───────────────────┐                        │
│  │ profile           │  │ ws-connection     │                        │
│  │                   │  │                   │                        │
│  │ CRUD user profile │  │ $connect handler  │                        │
│  │ Account deletion  │  │ Store connId      │                        │
│  └──────────────────┘  └───────────────────┘                        │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
               ┌────────────────┼────────────────┐
               ▼                ▼                ▼
┌──────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│   DynamoDB        │  │ Amazon Cognito  │  │  Amazon Bedrock     │
│                   │  │                 │  │                     │
│ Users             │  │ User Pool       │  │ Claude (text gen)   │
│ Sessions          │  │ UBC email only  │  │ Titan (embeddings)  │
│ OverlapScores     │  │ JWT tokens      │  │ (stretch only)      │
│ MatchDecisions    │  │                 │  │                     │
│ WsConnections     │  │                 │  │                     │
└──────────────────┘  └─────────────────┘  └─────────────────────┘
```

---

## 2. Data Flow Design

### 2.1 Commute Session Flow

```
User taps "Start Commute"
        │
        ▼
[expo-location] foreground GPS sample every 60s
        │
        ▼
On-device: lat/lon → geohash(precision=7) + ISO timestamp
        │  (raw coordinates discarded immediately)
        ▼
In-memory buffer: [{ geohash, timestamp }, ...]
        │
User taps "End Commute"
        │
        ▼
POST /sessions { userId, sessionId, startTime, endTime, trail: [...] }
        │
        ▼
Lambda: session-upload
  ├── Validate payload schema
  ├── Write to DynamoDB Sessions table (TTL = 30 days)
  ├── Return 202 Accepted to client
  └── Async invoke: matching-engine Lambda
        │
        ▼
Lambda: matching-engine
  ├── Fetch recent sessions from other users (last 30 days)
  ├── For each other user: compute pairwise overlap score
  │     └── Count shared geohash cells within ±15 min window
  ├── Check recurrence threshold (≥2 overlapping sessions)
  ├── If threshold crossed:
  │     ├── Store aggregate score in OverlapScores
  │     ├── DELETE contributing trail data from Sessions
  │     ├── Invoke Bedrock: generate explanation
  │     └── Push notification to both users (WebSocket or Expo Push)
  └── If not: no action, session remains for future comparisons
```

### 2.2 Mutual Opt-In Flow

```
Both users receive notification: "You might share a commute with someone"
        │
        ▼
User opens Match Reveal screen
  ├── Displays AI-generated explanation (no identity info)
  ├── User taps "Accept" or "Not Interested"
  │
  ▼
POST /matches/:matchId/respond { decision }
        │
        ▼
Lambda: match-respond
  ├── Write decision to MatchDecisions table
  ├── Query: has the OTHER user also accepted?
  │
  ├── YES (mutual) ──► Update OverlapScores status → "connected"
  │                     Push "match_accepted" to both (with profile data)
  │
  ├── NO (one-sided accept) ──► No action, wait
  │
  └── DECLINE ──► Flag match as declined, no notification
```

### 2.3 Data Lifecycle

| Data | Created | Deleted |
|------|---------|---------|
| Raw GPS coordinates | On-device during session | Immediately after geohash conversion (never persisted) |
| Geohash+timestamp trail | Written to DynamoDB on session end | After overlap score computed for that pair, OR auto-expired by 30-day TTL |
| Overlap score (aggregate) | After matching engine detects recurring overlap | On account deletion |
| Match explanation (text) | Generated by Bedrock when score crosses threshold | On account deletion |
| Match decision | When user taps Accept/Decline | On account deletion |
| User profile | On onboarding completion | On account deletion |
| WebSocket connectionId | On client connect | On client disconnect |

---

## 3. Component Design

### 3.1 Frontend Components (React Native / Expo)

#### Screen Hierarchy

```
App (expo-router)
├── (auth)
│   ├── signup.tsx          — email + 3 fields
│   └── verify.tsx          — verification code input
├── (tabs)
│   ├── home.tsx            — Start/End Commute button, pending matches
│   ├── connections.tsx     — list of mutual connections
│   └── settings.tsx        — profile edit, account deletion
├── commute.tsx             — active commute map + controls
├── match/[id].tsx          — match reveal + accept/decline
└── connection/[id].tsx     — connected profile view
```

#### Key Frontend Modules

| Module | Responsibility | Key Dependencies |
|--------|---------------|-----------------|
| `lib/geohash.ts` | Encode lat/lon → geohash string (level 7) | `ngeohash` package |
| `lib/location.ts` | Manage expo-location foreground subscriptions | `expo-location` |
| `lib/api.ts` | HTTP client wrapper, JWT attachment, retry logic | `fetch` / `axios` |
| `lib/websocket.ts` | WebSocket connection manager, reconnect logic | Native WebSocket |
| `lib/auth.ts` | Cognito sign-up, verify, token refresh | `aws-amplify` or REST |
| `lib/storage.ts` | Secure token storage, pending upload queue | `expo-secure-store` |
| `hooks/useCommute.ts` | State machine: idle → active → uploading → idle | React state + effects |
| `hooks/useMatches.ts` | Fetch pending matches, listen for WebSocket events | `lib/api` + `lib/websocket` |

#### State Management

No global state library at MVP. Use:
- React Context for auth state (JWT, userId)
- Local component state for screen-specific UI
- `useCommute` hook encapsulates the entire commute session lifecycle

#### Geohash Encoding (On-Device)

```typescript
// lib/geohash.ts
import ngeohash from 'ngeohash';

const PRECISION = 7; // ≈153m × 153m cells

export function encodeLocation(lat: number, lon: number): string {
  return ngeohash.encode(lat, lon, PRECISION);
}

export interface TrailPoint {
  geohash: string;
  timestamp: string; // ISO 8601
}
```

---

### 3.2 Backend Components (Python / AWS Lambda)

#### Lambda Function Design

Each Lambda is a single Python file with a handler function, plus shared utility modules.

```
backend/
├── shared/
│   ├── geohash_utils.py      — overlap scoring, recurrence check
│   ├── dynamo.py             — DynamoDB client wrapper
│   ├── bedrock.py            — Bedrock invocation, prompt construction
│   ├── websocket_push.py     — Push messages via API Gateway @connections
│   └── models.py             — Pydantic models for request/response validation
├── handlers/
│   ├── session_upload.py     — POST /sessions handler
│   ├── matching_engine.py    — Async matching invocation
│   ├── match_respond.py      — POST /matches/:matchId/respond handler
│   ├── profile.py            — GET/PUT/DELETE /profile handler
│   └── ws_connect.py         — WebSocket $connect/$disconnect handler
├── tests/
│   ├── test_geohash_utils.py
│   ├── test_matching.py
│   └── test_bedrock.py
└── requirements.txt
```

#### Overlap Scoring Algorithm

```python
# shared/geohash_utils.py

def compute_overlap(trail_a: list[dict], trail_b: list[dict],
                    time_window_seconds: int = 900) -> float:
    """
    Compare two geohash+timestamp trails.
    A point in trail_a "overlaps" with trail_b if:
      1. Same geohash cell, AND
      2. Timestamps within ±time_window_seconds of each other

    Returns: overlap ratio (0.0-1.0) = overlapping_points / min(len(a), len(b))
    """
    score = 0
    for point_a in trail_a:
        for point_b in trail_b:
            if point_a['geohash'] == point_b['geohash']:
                delta = abs(parse_ts(point_a['timestamp']) - parse_ts(point_b['timestamp']))
                if delta.total_seconds() <= time_window_seconds:
                    score += 1
                    break  # one match per point_a
    return score / max(min(len(trail_a), len(trail_b)), 1)


def check_recurrence(pair_scores: list[float], min_sessions: int = 2,
                     min_avg_score: float = 0.3) -> bool:
    """
    A pair is a "recurring overlap" if:
      - They have overlapped on >= min_sessions different days
      - Their average overlap score >= min_avg_score
    """
    if len(pair_scores) < min_sessions:
        return False
    return (sum(pair_scores) / len(pair_scores)) >= min_avg_score
```

#### Bedrock Prompt Design

```python
# shared/bedrock.py

EXPLANATION_PROMPT = """You are writing a brief, friendly notification for a university 
commuter student. Based on the following overlap data, write 2-3 sentences explaining 
that they might share a commute with another student. Be specific about timing and 
geography. Do NOT include any numerical scores, IDs, or technical terms.

Overlap data:
- Shared timing: {shared_timing}
- Approximate shared corridor: {corridor_description}
- Their faculty: {user_faculty}
- Other person's faculty: {other_faculty}

Write the notification text only, nothing else."""
```

**Input sanitization:** The Lambda constructs `shared_timing` and `corridor_description` from aggregate data only. No user IDs, session IDs, or raw geohash strings are included in the prompt.

---

### 3.3 Infrastructure Components

#### DynamoDB Table Schemas

**Users**
| Attribute | Type | Key | Notes |
|-----------|------|-----|-------|
| userId | S | PK | Cognito sub |
| email | S | | UBC email |
| displayName | S | | |
| homeArea | S | | Coarse neighbourhood |
| campusDestination | S | | "UBC Vancouver" or "UBC Okanagan" |
| faculty | S | | Optional |
| year | N | | Optional |
| socials | M | | `{ instagram?: str, linkedin?: str, discord?: str }` |
| pushToken | S | | Expo push token |
| createdAt | S | | ISO 8601 |

**Sessions**
| Attribute | Type | Key | Notes |
|-----------|------|-----|-------|
| userId | S | PK | |
| sessionId | S | SK | UUID |
| startTime | S | | ISO 8601 |
| endTime | S | | ISO 8601 |
| trail | L | | List of `{ geohash: S, timestamp: S }` |
| ttl | N | | Unix epoch, 30 days from creation |

**OverlapScores**
| Attribute | Type | Key | Notes |
|-----------|------|-----|-------|
| pairKey | S | PK | Sorted `userId1#userId2` |
| computedAt | S | SK | ISO 8601 |
| score | N | | Aggregate overlap score |
| sessionCount | N | | Number of overlapping sessions |
| sharedWindow | S | | Human-readable timing, e.g. "weekdays 8:15-8:45 AM" |
| explanation | S | | Bedrock-generated text |
| status | S | | `pending` → `notified` → `connected` or `declined` |
| matchId | S | | UUID, used as reference for MatchDecisions |

GSI: `status-index` on `status` attribute for querying pending/connected matches.

**MatchDecisions**
| Attribute | Type | Key | Notes |
|-----------|------|-----|-------|
| matchId | S | PK | References OverlapScores.matchId |
| userId | S | SK | |
| decision | S | | `accept` or `decline` |
| decidedAt | S | | ISO 8601 |

**WsConnections**
| Attribute | Type | Key | Notes |
|-----------|------|-----|-------|
| userId | S | PK | |
| connectionId | S | | API Gateway WebSocket connection ID |
| connectedAt | S | | ISO 8601 |
| ttl | N | | Auto-expire stale connections after 24h |

---

#### API Gateway Configuration

**REST API Routes**

| Method | Path | Lambda | Auth |
|--------|------|--------|------|
| POST | /auth/signup | (Cognito direct) | None |
| POST | /auth/verify | (Cognito direct) | None |
| POST | /sessions | session-upload | Cognito JWT |
| GET | /matches | profile (shared) | Cognito JWT |
| POST | /matches/{matchId}/respond | match-respond | Cognito JWT |
| GET | /connections | profile (shared) | Cognito JWT |
| GET | /profile | profile | Cognito JWT |
| PUT | /profile | profile | Cognito JWT |
| DELETE | /profile | profile | Cognito JWT |

**WebSocket API Routes**

| Route | Lambda | Notes |
|-------|--------|-------|
| $connect | ws-connect | Validates JWT query param, stores connectionId |
| $disconnect | ws-connect | Removes connectionId from WsConnections |
| $default | (none) | Client does not send messages; server-push only |

---

## 4. Security Design

### 4.1 Authentication

- Amazon Cognito User Pool with email-based sign-up
- Pre-sign-up Lambda trigger validates email domain: `/@(student\.)?ubc\.ca$/`
- JWT access tokens issued with 1-hour expiry
- Refresh tokens with 30-day expiry stored in `expo-secure-store`
- All API Gateway routes (except /auth/*) use Cognito Authorizer

### 4.2 Authorization

- Each Lambda extracts `userId` from the validated JWT claims (`sub` field)
- Users can only access their own sessions, profile, matches, and connections
- Pairwise data (OverlapScores) is accessible by either user in the pair
- No admin endpoints or elevated roles at MVP

### 4.3 Data in Transit

- All API Gateway endpoints enforce HTTPS/TLS 1.2+
- WebSocket API uses WSS (TLS-encrypted WebSocket)
- No unencrypted HTTP endpoints exist

### 4.4 Data at Rest

- DynamoDB tables use AWS-managed encryption (AES-256) by default
- No additional client-side encryption at MVP (acceptable for hackathon)

### 4.5 Input Validation

- All Lambda handlers validate incoming payloads using Pydantic models
- Geohash strings validated: must be exactly 7 alphanumeric characters
- Timestamps validated: must be valid ISO 8601, within reasonable range (not in future, not older than 30 days)
- Trail length capped at 240 points (4 hours x 1 point/minute) to prevent abuse

---

## 5. Frontend UX Design

### 5.1 Screen Flow Diagram

```
                    ┌──────────────┐
                    │   Splash /   │
                    │   Auth Check │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │ (no token)              │ (valid token)
              ▼                         ▼
    ┌──────────────────┐      ┌──────────────────┐
    │   Sign Up        │      │      Home        │
    │   3 fields       │      │                  │
    └────────┬─────────┘      │  [Start Commute] │
             │                │  [Pending Match] │
             ▼                │  [Connections →] │
    ┌──────────────────┐      └───────┬──────────┘
    │   Verify Email   │              │
    └────────┬─────────┘       ┌──────┼──────┐
             │                 │      │      │
             ▼                 ▼      │      ▼
    ┌──────────────────┐  ┌────────┐  │  ┌──────────────┐
    │      Home        │  │Commute │  │  │ Connections  │
    └──────────────────┘  │  Map   │  │  │    List      │
                          └───┬────┘  │  └──────┬───────┘
                              │       │         │
                              ▼       │         ▼
                         (End → Home) │  ┌──────────────┐
                                      │  │  Connection  │
                              ┌───────┘  │   Profile    │
                              ▼          └──────────────┘
                    ┌──────────────────┐
                    │  Match Reveal    │
                    │                  │
                    │ [Accept] [Skip]  │
                    └────────┬─────────┘
                             │
                    (Accept → "Waiting..." or → Connection Profile)
```

### 5.2 Design Principles

- **One primary action per screen.** Home has one button. Match Reveal has two buttons. No cognitive overload.
- **No browsable lists of people.** Connections list shows only mutual matches, not candidates.
- **Privacy-first copy.** Every screen that touches location shows a reassurance line: "Your exact location never leaves your phone."
- **Minimal onboarding.** Three fields, no photo, no bio. Under 60 seconds.
- **Notification-driven discovery.** Users don't go looking for matches — matches come to them via push.

### 5.3 Colour and Typography (Suggested)

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#2563EB` (blue-600) | CTA buttons, active commute indicator |
| Success | `#16A34A` (green-600) | Mutual match confirmed |
| Background | `#F8FAFC` (slate-50) | Screen backgrounds |
| Surface | `#FFFFFF` | Cards, modals |
| Text Primary | `#0F172A` (slate-900) | Headings, body |
| Text Secondary | `#64748B` (slate-500) | Labels, timestamps |
| Font | System default (SF Pro / Roboto) | No custom fonts at MVP |

---

## 6. Error Handling Design

### 6.1 Client-Side

| Scenario | Behaviour |
|----------|----------|
| Location permission denied | Show explanation modal with button to open system settings |
| Upload fails (network) | Retry 3x with exponential backoff (1s, 2s, 4s), then show error toast with "Retry" button |
| Upload fails (server 5xx) | Same retry logic; if persistent, queue for background retry |
| WebSocket disconnects | Auto-reconnect with exponential backoff; fall back to polling `/matches` every 10s |
| JWT expired | Silently refresh using refresh token; if refresh fails, redirect to sign-in |
| Invalid session (0 points) | Prevent upload, show "Commute too short to record" message |

### 6.2 Server-Side

| Scenario | Behaviour |
|----------|----------|
| Malformed request body | Return 400 with structured error JSON `{ error: string, field?: string }` |
| Unauthorized (no/invalid JWT) | Return 401 (API Gateway Cognito authorizer handles this) |
| DynamoDB throttle | Lambda retries with SDK built-in backoff; if persistent, return 503 |
| Bedrock timeout/error | Fall back to a generic template explanation; log error to CloudWatch |
| Matching engine fails mid-run | Session data retained (TTL handles cleanup); matching retried on next session upload |
| WebSocket @connections post fails | Graceful degradation — skip push for that user; Expo Push handles offline delivery |

---

## 7. Deployment Architecture

```
AWS Account
├── Region: us-west-2 (or ca-central-1)
│
├── Cognito
│   └── User Pool: commuteity-users
│       ├── Pre-sign-up trigger Lambda (email domain validation)
│       └── App Client: commuteity-app
│
├── API Gateway
│   ├── REST API: commuteity-api (stage: dev)
│   │   └── Cognito Authorizer attached
│   └── WebSocket API: commuteity-ws (stage: dev)
│
├── Lambda
│   ├── commuteity-session-upload     (Python 3.12, 256 MB, 30s timeout)
│   ├── commuteity-matching-engine    (Python 3.12, 512 MB, 120s timeout)
│   ├── commuteity-match-respond      (Python 3.12, 256 MB, 30s timeout)
│   ├── commuteity-profile            (Python 3.12, 256 MB, 30s timeout)
│   ├── commuteity-ws-connect         (Python 3.12, 128 MB, 10s timeout)
│   └── commuteity-email-validator    (Python 3.12, 128 MB, 5s timeout)
│
├── DynamoDB
│   ├── commuteity-users
│   ├── commuteity-sessions           (TTL enabled)
│   ├── commuteity-overlap-scores     (GSI: status-index)
│   ├── commuteity-match-decisions
│   └── commuteity-ws-connections     (TTL enabled)
│
├── Bedrock
│   └── Model access: anthropic.claude-3-haiku (text generation)
│       └── (stretch) amazon.titan-embed-text-v2 (embeddings)
│
└── IAM
    └── Role: commuteity-lambda-role
        ├── AmazonDynamoDBFullAccess (scoped to commuteity-* tables)
        ├── AmazonBedrockFullAccess (scoped to specific models)
        └── AmazonAPIGatewayInvokeFullAccess (for @connections push)
```

All provisioning via AWS CLI. No CDK, SAM, CloudFormation, or Terraform.

---

## 8. Testing Strategy (Hackathon-Scoped)

Given the 6.5-hour constraint, testing is minimal but targeted:

| Layer | What | How |
|-------|------|-----|
| Unit | `geohash_utils.py` overlap scoring | pytest, 4-5 hardcoded trail pairs |
| Unit | Geohash encoder (frontend) | Manual verification of known lat/lon → geohash |
| Integration | Session upload round-trip | curl POST to deployed API, verify DynamoDB write |
| Integration | Match flow end-to-end | Trigger matching engine with seeded data, verify notification arrives |
| Demo | Full user journey | Seeded accounts with pre-computed overlaps guarantee demo works regardless of real-time usage |

No CI/CD pipeline. No automated test runner in the build. Testing is manual and targeted at demo reliability.

---

## 9. Scalability Notes (Post-Hackathon Considerations)

These are NOT built during the hackathon but documented for judges who ask "what's next":

- **Matching engine O(n squared) problem:** Current design compares new session against all other sessions. Post-hackathon: partition by campus destination and time-of-day bucket to reduce comparisons.
- **Geohash precision tuning:** Level 7 is a privacy/accuracy tradeoff. Could offer user control post-MVP.
- **Background location:** iOS/Android background location could replace manual check-in for a smoother UX, but requires significant permission handling and battery optimization.
- **Group commutes:** Extend pairwise matching to detect clusters of 3+ users sharing a commute.
- **Rate limiting:** API Gateway throttling should be configured per-user to prevent abuse.

---

## 10. Decision Log

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Geohash level 7 (153m cells) | Balances overlap detection accuracy with privacy — can't pinpoint a house | Level 6 (too coarse, 1.2km), Level 8 (too fine, 38m — privacy risk) |
| Manual check-in (not background tracking) | Simpler permissions, better battery, more user control, faster to build | Always-on background tracking (complex, battery drain, trust issue) |
| Trail data deleted after scoring | Minimizes stored PII; only aggregate needed for match decision | Retain trails indefinitely (privacy risk, storage cost) |
| WebSocket + Expo Push fallback | Real-time feel when app is open; reliable delivery when closed | Polling only (laggy), Firebase Cloud Messaging (non-AWS dependency) |
| No in-app chat | Keeps scope manageable for 6.5 hours; social handles suffice for contact | Built-in chat (weeks of work, moderation needed) |
| Bedrock Claude Haiku for explanations | Fast, cheap, good at natural language; available in Bedrock | GPT-4 (not AWS-native), Claude Sonnet (slower, unnecessary quality for 2 sentences) |
| DynamoDB over PostgreSQL (RDS) | Serverless, no connection pooling, pay-per-request, schema-flexible for hackathon speed | RDS (connection management overhead, provisioning time) |
| Expo over bare React Native | Managed workflow handles location permissions, push tokens, builds without Xcode/Android Studio config time | Bare RN (too much config for hackathon), Flutter (team doesn't know Dart) |
