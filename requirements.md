# Commutity — Requirements

**Project:** Commutity  
**Event:** UBC × CIC Summer 2026 Hackathon — Student Success Tools theme  
**Date:** August 6, 2026  
**Version:** 1.0 (MVP)

---

## 1. Problem Statement

UBC commuter students spend their campus time almost entirely in class or studying, missing the low-stakes, informal social interactions that on-campus residents get by default. Existing social and matching apps require active profile browsing, which feels high-stakes and doesn't fit the specific context of "I just want to know who I actually share a commute with." Commutity solves this by passively detecting genuine recurring commute overlap and surfacing it only when it is real and mutual — no swiping, no browsing, no speculation.

---

## 2. Functional Requirements

### 2.1 Authentication & Onboarding

**FR-01** The app shall require sign-up with a `@student.ubc.ca` or `@ubc.ca` email address. No other email domains shall be accepted.

**FR-02** Amazon Cognito shall handle email verification. Users must verify their address before accessing any feature beyond the sign-up screen.

**FR-03** Onboarding shall collect exactly three fields after email verification:
- Home area (neighbourhood or municipality, free text or coarse dropdown — no street address)
- Campus destination (UBC Vancouver, UBC Okanagan)
- Display name

**FR-04** Onboarding shall be completable in under 60 seconds. No optional fields, no photo upload, no interest tags at MVP.

**FR-05** On subsequent app launches, a verified and onboarded user shall land directly on the Home screen (no re-onboarding).

---

### 2.2 Commute Check-In

**FR-06** The Home screen shall display a single, prominent **Start Commute** button.

**FR-07** Tapping Start Commute shall begin an active commute session. The button shall change state to **End Commute**. The session start timestamp and a unique session ID shall be recorded.

**FR-08** During an active session, the app shall request foreground location permission (not background) and sample the device's GPS location at a configurable interval (default: every 60 seconds).

**FR-09** Each raw GPS coordinate shall be immediately converted on-device to a geohash at precision level 7 (≈153 m × 153 m cell). The raw coordinate shall be discarded after conversion and shall never leave the device.

**FR-10** The app shall maintain an in-session buffer of `{ geohash: string, timestamp: ISO8601 }` tuples. This buffer is held in memory only during the session.

**FR-11** Tapping End Commute shall stop sampling, close the session, and transmit the geohash+timestamp sequence to the backend via the REST endpoint defined in the API contract. The in-memory buffer shall be cleared immediately after a confirmed successful upload.

**FR-12** If the upload fails, the app shall retry up to three times with exponential backoff before notifying the user of the failure. The buffer shall be retained in device storage during retry attempts only, then discarded regardless of outcome.

**FR-13** The Active Commute screen shall display a map view showing the user's current position (dot on map). No other users' positions shall ever be rendered.

**FR-14** The app shall not perform background location tracking at any point. Location access ceases the moment the session ends.

---

### 2.3 Overlap Detection (Backend)

**FR-15** After a commute session is uploaded, the backend matching Lambda shall compare the new session's geohash+timestamp sequence against recent sessions from other users.

**FR-16** Overlap scoring shall consider both spatial overlap (shared geohash cells) and temporal proximity (arrivals at shared cells within a configurable time window, default ±15 minutes).

**FR-17** A pairwise overlap score shall only be computed between sessions that occurred on different calendar days (i.e., the system tracks recurrence across multiple trips, not a single shared trip).

**FR-18** When a pair's cumulative overlap score crosses a defined threshold (minimum: 2 overlapping sessions with a combined score above a configurable value), the system shall trigger the notification + opt-in flow.

**FR-19** After the overlap score for a pair is computed and stored in DynamoDB, the individual geohash+timestamp trail data for that pair shall be deleted from DynamoDB. Only the aggregate overlap result (score, session count, approximate shared timing window) is retained.

**FR-20** The matching engine shall be idempotent: re-running it on already-processed session pairs shall not generate duplicate notifications or duplicate match records.

---

### 2.4 Match Notification & Explanation

**FR-21** When the overlap threshold is crossed, the backend shall invoke Amazon Bedrock (Anthropic Claude model via Bedrock) to generate a natural-language explanation of the overlap. The explanation shall:
- Reference specific shared timing (e.g., "most weekday mornings around 8:30 AM")
- Reference approximate shared route geography (e.g., "heading through the Broadway corridor")
- Reference any available profile context (faculty, year) if both users have provided it
- Be 2–3 sentences maximum
- Never include a numerical similarity score

**FR-22** The explanation shall be delivered as a push notification to both users simultaneously, framed as "You might share a commute with someone" — not "You matched with [name]." No identifying information about the other user shall appear in the notification.

**FR-23** Push notifications shall be delivered via the WebSocket API Gateway connection if the user is online, and via Expo Push Notifications if offline.

---

### 2.5 Mutual Opt-In Flow

**FR-24** Tapping the push notification shall open a Match Reveal screen displaying:
- The AI-generated natural-language overlap explanation
- An **Accept** button and a **Not Interested** button
- No information about the other user (name, photo, faculty) at this stage

**FR-25** The opt-in decision shall be recorded in DynamoDB against the user's ID and the match ID. A user may change their decision from "Not Interested" to "Accept" but not the reverse.

**FR-26** The connection shall unlock **only** when both users have independently recorded an "Accept" decision. A single acceptance shall have no visible effect on either side.

**FR-27** If a user taps "Not Interested," the match record shall be flagged. Neither user shall be notified of this outcome. The rejected match shall not resurface unless the overlap threshold is exceeded again on entirely new session data (i.e., the system does not re-notify on the same underlying data).

---

### 2.6 Connected Profile Reveal

**FR-28** Upon mutual acceptance, both users shall receive a notification: "Your commute connection accepted — see their profile."

**FR-29** The Connected Profile screen shall display, and only display:
- Display name
- Faculty and year (if the user provided them during onboarding or profile edit)
- Up to three user-linked social handles (Instagram, LinkedIn, Discord — user's choice; no OAuth required, plain text handles only)
- The AI-generated overlap explanation that triggered the match

**FR-30** There shall be no in-app messaging, no photo display, and no mutual friends list at MVP.

**FR-31** A user shall be able to view all their active connections from the Home screen via a **Connections** list entry point.

---

### 2.7 Profile Management

**FR-32** A user shall be able to edit their display name, home area, faculty/year, and social handles at any time from a Settings screen.

**FR-33** A user shall be able to delete their account. Account deletion shall:
- Remove their Cognito user record
- Remove their DynamoDB user profile
- Remove all associated session data and overlap scores
- Flag any pending or active matches as dissolved
- Complete within 30 seconds (async cleanup acceptable with confirmation shown immediately)

---

## 3. User Stories

| ID | As a… | I want to… | So that… |
|----|-------|-----------|----------|
| US-01 | UBC commuter student | Sign up with my UBC email in under a minute | I can start using the app without friction |
| US-02 | UBC commuter student | Tap a single button to start tracking my commute | I don't have to think about it — it just works |
| US-03 | UBC commuter student | Know my exact GPS location is never sent anywhere | I can trust the app with my daily movement |
| US-04 | UBC commuter student | Receive a specific, human-readable explanation of why I might share a commute with someone | I immediately understand why this match is relevant, not just "you matched" |
| US-05 | UBC commuter student | Only see who I matched with after both of us agreed | I don't feel exposed or surveilled |
| US-06 | UBC commuter student | See a simple profile (name, faculty, socials) after both accept | I have enough context to reach out on my own terms |
| US-07 | UBC commuter student | Never browse a list of potential matches | The experience feels low-pressure, not like a dating app |
| US-08 | UBC commuter student | Stop and delete my account and data at any time | I have full control over my presence on the platform |
| US-09 | Hackathon demo judge | See a realistic end-to-end match flow during the demo | I can evaluate the full concept without waiting for real usage |
| US-10 | UBC commuter student | Have the app work without draining my battery | I can leave it installed and use it daily |

---

## 4. Privacy & Data-Handling Requirements

These are first-class design constraints, not afterthoughts.

**PD-01 — Raw GPS never leaves the device.** Location coordinates from `expo-location` shall be converted to geohash cells on-device before any network call. No API endpoint shall accept raw latitude/longitude from clients.

**PD-02 — Minimum geohash precision.** Geohash precision shall be set to level 7 (≈153 m × 153 m) or coarser. Higher precision (smaller cells) is explicitly prohibited, as it would allow re-identification of a user's home or workplace.

**PD-03 — Trail data is ephemeral.** The per-session geohash+timestamp sequence stored in DynamoDB is transient. Once the pairwise overlap score has been computed, the raw trail records for the contributing sessions shall be deleted. The system retains only the aggregate result.

**PD-04 — No persistent location history.** DynamoDB shall never accumulate a long-term location history for any user. Session trails older than 30 days that have not been matched shall be auto-expired via DynamoDB TTL.

**PD-05 — Asymmetric reveal.** Before mutual acceptance, neither user can see who they are potentially matched with. User identity is revealed only post-mutual-opt-in and only to each other.

**PD-06 — Foreground-only location.** The app shall request `foreground` location permission only. `background` or `always` permission shall not be requested.

**PD-07 — No third-party analytics.** No third-party analytics SDKs (e.g., Amplitude, Mixpanel, Firebase Analytics) shall be added at MVP. AWS CloudWatch is acceptable for backend metrics.

**PD-08 — Social handles are plain text.** Social handles stored in the profile are not scraped, verified, or enriched. They are stored as user-supplied strings and displayed as-is.

**PD-09 — Bedrock prompt privacy.** When constructing the Bedrock prompt for the natural-language explanation, the Lambda shall include only: approximate shared timing window, approximate shared geographic corridor (geohash-derived region label, not coordinates), and profile fields (faculty/year) if available. It shall not include session IDs, user IDs, or geohash sequences in the prompt.

**PD-10 — Account deletion is complete.** Account deletion (FR-33) covers all PII and derived data. No shadow records shall be retained.

---

## 5. Non-Functional Requirements

**NFR-01 — Latency.** The commute session upload (FR-11) shall complete in under 3 seconds on a typical LTE connection for a session of up to 120 geohash points.

**NFR-02 — Cold start.** Lambda cold starts shall not block the user-facing upload response. Session upload acknowledgment and overlap computation shall be decoupled (upload returns 202 Accepted; matching runs async).

**NFR-03 — Offline resilience.** If the device has no network connection when the user taps End Commute, the app shall queue the upload and retry automatically when connectivity is restored (FR-12).

**NFR-04 — Battery.** GPS sampling at 60-second intervals during an active session shall not cause measurable background battery drain because location access is foreground-only and ceases when the session ends.

**NFR-05 — Demo reliability.** The infra engineer shall seed 2–3 demo accounts in DynamoDB with pre-computed overlap scores at or above the match threshold, so the judge demo can trigger a full match reveal without depending on real-time usage.

---

## 6. Stretch Feature Requirements

These are explicitly out of scope for the MVP build day and shall only be started after the full MVP flow is working end-to-end and demo-tested.

**SF-01 — TransLink GTFS route labelling.** The backend shall cross-reference a user's geohash trajectory against pre-processed TransLink GTFS route polylines (static data, pre-downloaded) using geometric distance comparison (Haversine or similar) to label a commute session as "likely Route X" or "likely walk/bike/drive." This is a geometric algorithm, not an LLM call. Bedrock shall not be used for this step.

**SF-02 — Embedding-based similarity search.** The backend shall generate vector embeddings of commute sessions (via Amazon Bedrock Embeddings) and use vector similarity search to surface users with similar-but-not-identical commute patterns, extending matches beyond exact geohash overlap.

---

## 7. Hackathon Rule Compliance Notes

**HC-01 — Preprocessed data is permitted.** The event rules explicitly allow preprocessed data. The TransLink GTFS static dataset (routes, stops, stop_times, shapes) shall be downloaded and preprocessed into a DynamoDB-compatible or S3-resident format before the build day begins. No live TransLink API calls are required.

**HC-02 — AWS services only for cloud infra.** All cloud infrastructure uses AWS services (Lambda, API Gateway, DynamoDB, Cognito, Bedrock). No competing cloud provider services shall be introduced.

**HC-03 — AWS CLI for provisioning.** All AWS resource provisioning shall use the AWS CLI. No CDK, SAM, Terraform, or console click-ops. CLI commands shall be documented in the infra workstream tasks.

**HC-04 — No PII in datasets.** The seeded demo data and GTFS data contain no PII. Demo account credentials shall be stored locally on the team's machines only and not committed to version control.

**HC-05 — Student Success Tools theme alignment.** The product directly addresses commuter student social isolation at UBC, which falls within the Student Success Tools theme. The match explanation feature (FR-21) specifically contextualises the tool as a campus community-building aid.

**HC-06 — AI use disclosure.** Amazon Bedrock usage is limited to (a) natural-language match explanation generation (FR-21) and (b) stretch embedding similarity (SF-02). Any submission materials shall clearly disclose these specific AI uses.

---

## 8. Out of Scope (MVP)

- In-app chat or messaging
- Photo or avatar upload
- Group commutes (more than 2 users in a match)
- Real-time TransLink trip data (only static GTFS)
- Web app (mobile only)
- Android vs. iOS feature parity beyond what Expo provides by default
- Push notification delivery receipts or read tracking
- Moderation / reporting tools
- Monetisation or premium tier
