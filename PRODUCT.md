# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

UBC students (Vancouver and Okanagan campuses) who commute to campus by transit, bike, or car and want to find other students on the same commute. UBC-verified email required to join (`@ubc.ca` / `@student.ubc.ca`).

## Product Purpose

Commutity turns a solitary daily commute into a low-effort way to meet fellow students. A user taps "Start Commute" when they leave and "End Commute" when they arrive; the app samples coarse location in the background of that session only. When two users' commutes recur with meaningful overlap (same corridor, same time window, across multiple trips), both are notified that they may share a commute. Success is a mutual opt-in connection made with zero browsing, swiping, or profile searching.

## Positioning

Passive, privacy-first matching by inferred behavior (recurring route/time overlap) rather than active discovery (no browsing candidate lists, no swiping, no search). Matching is notification-driven: matches come to the user, the user never goes looking. This is the mechanism a browse/swipe commute-buddy app could not truthfully copy.

## Operating Context

- Primary flows: sign up with UBC email → verify code → one-time profile setup (name, major, year, home area, campus, optional socials) → Home / Track / Matches / Profile tabs.
- Track: user explicitly starts and stops each commute session; location is only sampled while a session is active.
- Matches: a pending match shows only an AI-generated explanation and shared time window, no identity, until both sides opt in; once mutual, it becomes a Connection revealing name/faculty/year/socials.
- Used outdoors and on transit, at variable times of day (dawn commute through evening commute) and variable lighting/network conditions.

## Capabilities and Constraints

- Client: Expo (managed workflow, SDK 54) / React Native, Expo Router, NativeWind. No `ios/` or `android/` native project directories — must stay compatible with Expo Go / managed builds.
- No in-app chat; connected users exchange contact via the social handles they chose to share.
- No browsable list of match candidates, ever — this is a stated privacy commitment, not a missing feature.
- Every screen that touches location should reassure the user their exact location never leaves their phone unaggregated.
- Backend (AWS Lambda/DynamoDB/Cognito/Bedrock) is out of scope for this round of work — frontend/UI only.

## Brand Commitments

- Name: Commutity / Commuteity (app identity strings currently mixed across files; not resolved here, preserve existing usage per file rather than renaming).
- Aesthetic direction (user-pinned, this round): dark-first, shadcn/ui-inspired component craft (restrained neutrals, hairline borders, no rounded-bubble/pill-everywhere styling), single forest-green accent (`#3F7449` primary / `#A1C8A8` muted), taking cues from Strava/Komoot-style commute-map apps for the live map surface.

## Evidence on Hand

- No real user testimonials, screenshots, or press. Hackathon MVP (UBC × CIC Summer 2026).
- `DESIGN.md` documents an early architecture/UX spec written before the current visual direction; treat its architecture sections as background, its color/typography suggestions as superseded by this round's pinned direction.

## Product Principles

1. One primary action per screen — no cognitive overload (Home has one button, Match Reveal has two).
2. Notification-driven discovery, never browse/search — matches come to the user.
3. Privacy-first copy and behavior on every location-adjacent surface.
4. Minimal onboarding — profile setup stays fast, nothing blocks getting to Home.
5. Craft the operate-mode chrome (forms, lists, tab bar) with the same care as the map surface; brand lives in precise detail, not decoration.

## Accessibility & Inclusion

No project-specific requirement established beyond standard mobile contrast/touch-target expectations (WCAG AA text contrast, ≥48×48dp touch targets), inherited from the existing spec.
