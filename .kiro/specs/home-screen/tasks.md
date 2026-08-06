# Implementation Plan: Home Screen

## Overview

This plan implements the COMMUTEity tabbed home screen using Expo SDK 57 with Expo Router for file-based tab navigation. Tasks proceed from project setup through theme/data constants, utility functions, shared components, tab screens, and finally tests. All data is mocked locally with typed constants matching backend API shapes.

## Tasks

- [x] 1. Set up Expo Router and project structure
  - [x] 1.1 Install dependencies and configure Expo Router
    - Install `expo-router`, `@expo/vector-icons`, and configure `app.json` for Expo Router (set `scheme`, update `main` entry point)
    - Create the `app/` directory with `_layout.tsx` (root Stack layout) and `app/(tabs)/_layout.tsx` (tab navigator)
    - Create placeholder files: `app/(tabs)/index.tsx`, `app/(tabs)/track.tsx`, `app/(tabs)/matches.tsx`, `app/(tabs)/profile.tsx`
    - Remove or repurpose `App.tsx` since Expo Router uses `app/_layout.tsx` as entry
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Create directory structure for constants, components, and utils
    - Create `constants/` directory with empty `theme.ts` and `mockData.ts` files
    - Create `components/` directory
    - Create `utils/` directory
    - Create `__tests__/utils/`, `__tests__/components/`, `__tests__/screens/` directories
    - _Requirements: 6.1, 7.1_

- [x] 2. Implement theme constants and mock data
  - [x] 2.1 Define theme constants
    - Create `constants/theme.ts` with full theme object: colors, spacing, borderRadius, fontSize, fontWeight, shadow tokens
    - All colour values as per design (primary, primaryActive, success, background, surface, textPrimary, textSecondary, border, disabled, destructive, warning)
    - Export as `const` assertion for type safety
    - _Requirements: 8.1, 8.3, 8.5, 7.4_

  - [x] 2.2 Define mock data constants with TypeScript interfaces
    - Create `constants/mockData.ts` with interfaces: `UserProfile`, `Socials`, `ScheduleEntry`, `MatchCardData`, `CommuteSessionStatus`, `MatchNotification`, `OptInResponse`, `MatchProfile`
    - Export typed mock constants: `MOCK_USER`, `MOCK_SCHEDULE`, `MOCK_MATCHES`, `MOCK_COMMUTE_STATUS`
    - Ensure at least 2 match entries and at least 2 schedule entries
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 3. Implement utility functions
  - [x] 3.1 Implement greeting utility
    - Create `utils/greeting.ts` with `getGreeting(hour: number): string`
    - Return "Good morning" for hours 5–11, "Good afternoon" for 12–16, "Good evening" for 17–23 and 0–4
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 Implement time formatting utilities
    - Create `utils/timeFormat.ts` with `formatElapsedTime(totalSeconds: number): string` and `formatScheduleTime(time24: string): string`
    - `formatElapsedTime`: returns MM:SS for < 3600s, HH:MM:SS for >= 3600s
    - `formatScheduleTime`: converts "HH:MM" 24h string to "H:MM AM/PM" 12h format
    - Include `pad` helper function
    - _Requirements: 2.6, 3.6_

  - [x] 3.3 Implement match helper utilities
    - Create `utils/matchHelpers.ts` with `groupMatches(matches: MatchCardData[]): { pending, connected }` and type re-exports
    - Partition matches by status field
    - _Requirements: 4.4_

  - [x] 3.4 Implement avatar utility
    - Create `utils/avatar.ts` with `getAvatarInitial(name: string): string`
    - Return uppercase first character of name, or '?' for empty string
    - _Requirements: 5.5, 7.6_

- [x] 4. Checkpoint - Verify utilities compile
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement shared components
  - [x] 5.1 Implement Card component
    - Create `components/Card.tsx` with typed `CardProps` interface (children, title?, subtitle?, variant?)
    - Style using theme tokens only (surface background, border, borderRadius, shadow)
    - Render title/subtitle header when provided, always render children
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 8.3, 8.5_

  - [x] 5.2 Implement Button component
    - Create `components/Button.tsx` with typed `ButtonProps` interface (label, onPress, variant, disabled?, size?)
    - Variants: primary, secondary, destructive with theme-derived colours
    - Disabled state prevents onPress and applies muted style
    - Large size ensures minimum 48×48dp touch target
    - _Requirements: 7.1, 7.3, 7.4, 7.5, 8.1_

  - [x] 5.3 Implement Avatar component
    - Create `components/Avatar.tsx` with typed `AvatarProps` interface (name, imageUri?, size?)
    - Circular container, shows image when imageUri provided, otherwise renders initial from `getAvatarInitial`
    - _Requirements: 7.1, 7.6, 5.5_

  - [x] 5.4 Implement Badge component
    - Create `components/Badge.tsx` with typed `BadgeProps` interface (label, variant)
    - Pill-shaped container, variant (default, success, warning) drives colours from theme
    - _Requirements: 7.1, 7.7, 7.4_

- [x] 6. Implement tab screens
  - [x] 6.1 Implement Home tab screen
    - Create `app/(tabs)/index.tsx` with greeting display using `getGreeting` and user's displayName
    - Render ScrollView of Schedule Cards using `MOCK_SCHEDULE`, ordered by time
    - Display "No classes scheduled for today" when schedule is empty
    - Format times using `formatScheduleTime`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 6.2 Implement Track tab screen
    - Create `app/(tabs)/track.tsx` with commute state machine (idle | active)
    - Display campus destination from `MOCK_USER`
    - "Start Commute" button using primary colour, toggles to "End Commute" with active colour on press
    - Elapsed time display with 1-second interval using `formatElapsedTime`
    - Preserve session state across tab switches
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 6.3 Implement Matches tab screen
    - Create `app/(tabs)/matches.tsx` with grouped match display using `groupMatches`
    - Pending cards: show overlap explanation + shared window, hide identity
    - Connected cards: show displayName, faculty, year, socials, and explanation
    - Accept/Not Interested actions on pending cards with local state management
    - Empty state message when no matches
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [x] 6.4 Implement Profile tab screen
    - Create `app/(tabs)/profile.tsx` with Avatar, display name, home area, campus destination
    - Conditionally render faculty and year only when defined
    - Display social handles or "No social handles added" message
    - "Edit Profile" button triggers Alert acknowledging tap
    - "Delete Account" button triggers confirmation Alert with Cancel/Delete options
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 7. Checkpoint - Verify app renders and navigates
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Configure tab navigator with icons and styling
  - [x] 8.1 Configure tab layout with icons and active/inactive styling
    - Update `app/(tabs)/_layout.tsx` with proper tab icons from `@expo/vector-icons`
    - Set `tabBarActiveTintColor`, `tabBarInactiveTintColor`, `tabBarStyle` from theme
    - Ensure active tab is visually distinct from inactive tabs
    - Set `headerShown: false` in screenOptions
    - _Requirements: 1.1, 1.3, 8.1_

- [ ] 9. Write property-based tests for utility functions
  - [ ]* 9.1 Write property test for greeting utility
    - **Property 1: Time-of-day greeting correctness**
    - Test that `getGreeting` maps every hour [0-23] to correct greeting with no gaps or overlaps
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [ ]* 9.2 Write property test for schedule time formatting
    - **Property 3: 12-hour time formatting correctness**
    - Test that `formatScheduleTime` produces valid 12h output for any valid "HH:MM" input
    - **Validates: Requirements 2.6**

  - [ ]* 9.3 Write property test for elapsed time formatting
    - **Property 5: Elapsed time format correctness**
    - Test `formatElapsedTime` produces MM:SS for <3600s and HH:MM:SS for >=3600s with correct decomposition
    - **Validates: Requirements 3.6**

  - [ ]* 9.4 Write property test for match grouping
    - **Property 7: Match grouping partitions correctly**
    - Test `groupMatches` preserves all entries, partitions by status, and sums lengths equal input length
    - **Validates: Requirements 4.4**

  - [ ]* 9.5 Write property test for avatar initial extraction
    - **Property 10: Avatar initial extraction**
    - Test `getAvatarInitial` returns uppercase first char for non-empty strings and '?' for empty
    - **Validates: Requirements 5.5, 7.6**

- [ ] 10. Write component and screen tests
  - [ ]* 10.1 Write property test for disabled button
    - **Property 11: Disabled button prevents invocation**
    - Test that Button with `disabled={true}` never invokes onPress handler
    - **Validates: Requirements 7.3**

  - [ ]* 10.2 Write property test for commute state round-trip
    - **Property 4: Commute state machine round-trip**
    - Test that idle → start → end returns state to idle with startedAt null
    - **Validates: Requirements 3.4, 3.5**

  - [ ]* 10.3 Write property test for pending match identity hiding
    - **Property 6: Pending match card hides identity**
    - Test that rendered output for pending matches never contains matchedUser.displayName
    - **Validates: Requirements 4.2**

  - [ ]* 10.4 Write property test for match decline removal
    - **Property 8: Declining a match removes it from pending**
    - Test that declining any match from a list of N pending results in N-1 entries without the declined matchId
    - **Validates: Requirements 4.8**

  - [ ]* 10.5 Write property test for optional profile field omission
    - **Property 9: Optional profile fields omission**
    - Test that undefined faculty/year fields produce no rendered content for those labels
    - **Validates: Requirements 5.2**

  - [ ]* 10.6 Write property test for theme colour contrast
    - **Property 12: Theme colour contrast compliance**
    - Test that all text/background token pairs used together have WCAG contrast ratio >= 4.5:1
    - **Validates: Requirements 8.4**

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- All components use theme tokens exclusively — no hardcoded style values
- Mock data is typed to API contract shapes for easy future swap to real fetch
- Expo Router v4 (SDK 57) uses file-based routing with `(tabs)` directory convention
- Install `fast-check` as dev dependency for property-based testing
- Install `@testing-library/react-native` and `jest-expo` for component tests

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "2.2"] },
    { "id": 3, "tasks": ["3.1", "3.2", "3.3", "3.4"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3", "5.4"] },
    { "id": 5, "tasks": ["6.1", "6.2", "6.3", "6.4"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5"] },
    { "id": 8, "tasks": ["10.1", "10.2", "10.3", "10.4", "10.5", "10.6"] }
  ]
}
```
