# DynamoDB schema — COMMUTEity

Three tables, all on-demand billing, all in the same region as Cognito/Bedrock.
No GSIs — matching is a full scan of completed sessions with pairwise
comparison, done in the `/commute/end` Lambda. Fine at demo scale; not meant
to scale past that, and that's a deliberate tradeoff, not an oversight.

## Table: CommuteSessions
Each user's checkpoint sequence for a single commute session.

| Attribute       | Type | Notes                                         |
|-----------------|------|------------------------------------------------|
| user_id (PK)    | S    | Cognito `sub`                                  |
| session_id (SK) | S    | UUID generated at check-in start                |
| checkpoints     | L    | List of `{geohash: S, ts: N}`                   |
| status          | S    | `"active"` or `"completed"`                     |
| started_at      | N    | epoch seconds                                   |
| ended_at        | N    | epoch seconds (set when status -> completed)    |

Partition key: `user_id`, Sort key: `session_id`
(query "all of this user's sessions" with one call)

## Table: OverlapScores
Running aggregate overlap between each pair of users. This is the only place
raw checkpoint data influences long-term storage — no per-point history here,
just the aggregate result.

| Attribute          | Type | Notes                                     |
|---------------------|------|---------------------------------------------|
| pair_id (PK)        | S    | sorted `"userA#userB"` — always consistent  |
| overlap_count       | N    | how many sessions have scored as a match     |
| last_overlap_ratio  | N    | most recent `score_overlap()` ratio          |
| last_matched_at     | N    | epoch seconds                                |
| notified            | BOOL | whether a notification has already fired     |
| user_a_opted_in     | BOOL | mutual opt-in tracking                       |
| user_b_opted_in     | BOOL |                                               |

Partition key: `pair_id`
Always build `pair_id` as `sorted(user_a, user_b)` joined with `#` so
A-vs-B and B-vs-A resolve to the same row.

## Table: Users

| Attribute    | Type | Notes                              |
|--------------|------|--------------------------------------|
| user_id (PK) | S    | Cognito `sub`                        |
| email        | S    |                                       |
| home_area    | S    |                                       |
| destination  | S    |                                       |
| socials      | M    | `{instagram: S, linkedin: S, ...}`   |

## Trigger flow (for reference)
`/commute/end` is a direct API call from the frontend, not a DynamoDB
Streams trigger. The Lambda: marks the session `completed`, scans all other
`completed` sessions, runs pairwise overlap scoring, upserts `OverlapScores`
for any matches, and returns the new/updated matches in the same response.
Frontend builds directly against that response shape.