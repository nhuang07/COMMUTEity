# Requirements Document

## Introduction

This spec defines the Home Screen for the COMMUTEity mobile app — the primary landing experience after login. The Home Screen is a tabbed interface providing four sections: a greeting/schedule overview, a commute tracking entry point, a matches feed, and a user profile view. All data is mocked locally (no API calls). The screen is built with React Native (Expo SDK 57) using shadcn/ui-style components and a reusable component architecture.

## Glossary

- **Home_Screen**: The main tabbed interface users see after authentication, containing four section tabs
- **Greeting_Section**: The top area of the Home tab displaying a personalized greeting and today's schedule card
- **Track_Section**: The tab/section where users initiate and manage commute tracking
- **Matches_Section**: The tab/section displaying users with compatible (overlapping/similar) commute routes
- **Profile_Section**: The tab/section showing the current user's information
- **Schedule_Card**: A UI card displaying the user's upcoming schedule for the current day
- **Commute_Card**: A prominent card in the Track section containing the Start Commute action
- **Match_Card**: A card displaying summary info about a matched user (overlap explanation, shared timing)
- **Mock_Data**: Static, locally-defined constants representing API response shapes for commute, match, and profile data
- **Reusable_Component**: A self-contained UI component that can be used across multiple sections or screens

## Requirements

### Requirement 1: Tabbed Navigation Structure

**User Story:** As a commuter student, I want to navigate between Home, Track, Matches, and Profile sections, so that I can quickly access each feature area.

#### Acceptance Criteria

1. THE Home_Screen SHALL render a bottom tab navigator with four tabs labelled, in left-to-right order: Home, Track, Matches, and Profile
2. WHEN a tab is tapped, THE Home_Screen SHALL display the corresponding section content by switching the visible screen without unmounting the navigator or triggering a full navigation stack reset
3. THE Home_Screen SHALL visually indicate the currently active tab by rendering its icon or label in a colour or icon variant that differs from the inactive tabs
4. WHEN the app loads after authentication, THE Home_Screen SHALL display the Home tab as the default active section with its corresponding content visible
5. WHEN the user switches from one tab to another and then switches back, THE Home_Screen SHALL preserve the previously rendered content of each tab without resetting scroll position or local component state

### Requirement 2: Greeting Section

**User Story:** As a commuter student, I want to see a personalized greeting and my schedule for today, so that I feel welcomed and oriented each time I open the app.

#### Acceptance Criteria

1. THE Greeting_Section SHALL display a time-of-day greeting ("Good morning", "Good afternoon", or "Good evening") followed by the user's display name from Mock_Data
2. WHILE the device local time is between 05:00 and 11:59 inclusive, THE Greeting_Section SHALL display "Good morning"
3. WHILE the device local time is between 12:00 and 16:59 inclusive, THE Greeting_Section SHALL display "Good afternoon"
4. WHILE the device local time is between 17:00 and 04:59 inclusive, THE Greeting_Section SHALL display "Good evening"
5. THE Greeting_Section SHALL render a Schedule_Card for each of today's class schedule entries from Mock_Data, ordered by start time
6. THE Schedule_Card SHALL display for each entry: course name, time in 12-hour format with AM/PM, and location
7. IF today's Mock_Data contains no class schedule entries, THEN THE Greeting_Section SHALL display a message indicating no classes are scheduled for today in place of the Schedule_Card list

### Requirement 3: Track Section with Start Commute

**User Story:** As a commuter student, I want a clear, prominent button to start tracking my commute, so that I can begin a session with minimal effort.

#### Acceptance Criteria

1. THE Track_Section SHALL display a primary Commute_Card containing a "Start Commute" button with a minimum touch target of 48×48 dp
2. THE Commute_Card SHALL display the user's campus destination name (e.g., "UBC Vancouver") retrieved from Mock_Data
3. THE "Start Commute" button SHALL use the app's primary action colour and be the largest interactive element in the Track_Section
4. WHEN the "Start Commute" button is pressed, THE Track_Section SHALL update the button label to "End Commute" and change the button background colour to a visually distinct active-session colour differentiable from the primary action colour
5. WHEN the "End Commute" button is pressed, THE Track_Section SHALL revert the button label, colour, and style to the initial "Start Commute" state and stop the elapsed time display
6. WHILE a commute session is active, THE Track_Section SHALL display elapsed time in MM:SS format (switching to HH:MM:SS after 60 minutes), updating every 1 second
7. WHILE a commute session is active, IF the user navigates away from the Track_Section tab and returns, THEN THE Track_Section SHALL preserve the active session state and display the correct cumulative elapsed time

### Requirement 4: Matches Section

**User Story:** As a commuter student, I want to see people who share a similar or overlapping commute route with me, so that I can discover potential commute companions.

#### Acceptance Criteria

1. THE Matches_Section SHALL display a list of Match_Card components populated from Mock_Data, where each mock match entry contains: a pair_id (format: sorted user IDs joined by '#'), an AI-generated overlap explanation (maximum 3 sentences), an approximate shared timing window string, and a status field of either "pending" or "connected"
2. THE Match_Card for a pending match SHALL display: the AI-generated overlap explanation text and the approximate shared timing window, without revealing any identifying information about the other user
3. THE Match_Card for a connected match SHALL display: the other user's display name, faculty and year (if provided), up to three social handles (Instagram, LinkedIn, Discord), and the AI-generated overlap explanation text
4. THE Matches_Section SHALL group matches into two labeled sections: a "Pending" section for matches with status "pending" and a "Connections" section for matches with status "connected"
5. WHEN no matches exist in Mock_Data, THE Matches_Section SHALL display an empty state message indicating that matches will appear after at least 2 tracked commutes with overlapping routes
6. WHEN a Match_Card for a pending match is tapped, THE Matches_Section SHALL display Accept and Not Interested action buttons
7. WHEN the user taps the Accept button on a pending Match_Card, THE Matches_Section SHALL record the acceptance, disable both action buttons, and display a confirmation state indicating the user is waiting for the other person to respond
8. WHEN the user taps the Not Interested button on a pending Match_Card, THE Matches_Section SHALL remove that Match_Card from the pending section

### Requirement 5: Profile Section

**User Story:** As a commuter student, I want to see my profile information in one place, so that I can review what others see about me after a mutual match.

#### Acceptance Criteria

1. THE Profile_Section SHALL display the user's display name (maximum 50 characters), home area, campus destination, faculty, and year from Mock_Data
2. IF one or more optional profile fields (faculty, year) are absent in Mock_Data, THEN THE Profile_Section SHALL omit those fields from the display without showing empty placeholders or error states
3. THE Profile_Section SHALL display the user's linked social handles (Instagram, LinkedIn, Discord) from Mock_Data, showing each handle as a labeled text entry (maximum 3 handles, each up to 64 characters)
4. IF the user has no linked social handles in Mock_Data, THEN THE Profile_Section SHALL display a message indicating no social handles have been added
5. THE Profile_Section SHALL display a user avatar placeholder using the first letter of the user's display name rendered inside a circular container (no photo upload)
6. THE Profile_Section SHALL include a visible "Edit Profile" button and a "Delete Account" button, both distinguishable from informational content
7. WHEN the "Edit Profile" button is tapped, THE Profile_Section SHALL display a temporary visual confirmation (such as an alert or toast) acknowledging the tap was registered (no navigation required at this stage)
8. WHEN the "Delete Account" button is tapped, THE Profile_Section SHALL display a confirmation prompt before triggering any destructive action (no backend call required at this stage)

### Requirement 6: Mocked Data Architecture

**User Story:** As a frontend developer, I want all screen data sourced from a single local constants file matching the backend API response shapes, so that integration with the real API is straightforward later.

#### Acceptance Criteria

1. THE Home_Screen SHALL source all displayed data from a single local constants file (no inline hardcoded data in components)
2. THE Mock_Data file SHALL export TypeScript interfaces for each backend API response shape (user profile, commute session status, match notification, and match profile) and export corresponding typed constant objects conforming to those interfaces
3. THE Mock_Data file SHALL export a mock user profile object containing: userId (string), displayName (string), email (string), homeArea (string), campusDestination (string), faculty (string), year (number), and socials (object with optional instagram, linkedin, and discord string fields)
4. THE Mock_Data file SHALL export mock match data as an array of at least 2 entries, each containing: matchId (string), overlapExplanation (string), sharedWindow (string), status ("pending" or "connected"), and a matched user partial profile limited to displayName and faculty fields
5. THE Mock_Data file SHALL export mock schedule data as an array of at least 2 course entries, each containing: courseName (string), time (string), and location (string) fields
6. THE Mock_Data file SHALL export a mock commute session status object containing: sessionId (string) and status ("active" or "idle"), aligning with the POST /commute/start response shape

### Requirement 7: Reusable Component Structure

**User Story:** As a frontend developer, I want the UI built from small, reusable components, so that the codebase scales cleanly and components can be tested and composed independently.

#### Acceptance Criteria

1. THE Home_Screen SHALL be composed of components exported from a shared components directory, including at minimum: Card, Button, TabBar, Avatar, and Badge, each defined in its own file with a typed props interface
2. THE Card component SHALL accept children content, an optional title (string, max 100 characters rendered), and an optional subtitle (string, max 200 characters rendered) as typed props, rendering children only when no title or subtitle is provided
3. THE Button component SHALL accept a label (string, max 50 characters rendered), an onPress handler, a variant prop (primary, secondary, destructive), and an optional disabled prop that when true prevents onPress invocation and applies a visually distinct disabled style from the theme
4. THE components SHALL reference all spacing values, font sizes, font weights, and colour values exclusively from a shared theme constants file; no style value SHALL be hardcoded in component files
5. WHEN a shadcn/ui-style component is needed, THE component SHALL accept a children prop for composition, expose visual variations exclusively through a variant prop, and apply no default visual chrome beyond layout structure so that all decorative styling is controlled by the selected variant
6. THE Avatar component SHALL accept a name prop (string) and an optional imageUri prop, rendering the first character of name as fallback when imageUri is not provided
7. THE Badge component SHALL accept a label prop (string, max 20 characters rendered) and a variant prop (default, success, warning) that determines background and text colour from the shared theme constants file

### Requirement 8: Visual Design and Theming

**User Story:** As a commuter student, I want a clean, modern interface that feels cohesive, so that the app feels polished and trustworthy.

#### Acceptance Criteria

1. THE Home_Screen SHALL use a colour palette defined exclusively in a theme constants file with tokens for: primary, success, background, surface, textPrimary, and textSecondary; no hardcoded colour values SHALL appear outside that file
2. THE Home_Screen SHALL use the system default font (SF Pro on iOS, Roboto on Android) with no custom font loading
3. THE Home_Screen SHALL apply the background token colour to screen backgrounds and the surface token colour to card backgrounds
4. THE Home_Screen SHALL ensure all text meets a minimum contrast ratio of 4.5:1 against its immediate background colour for accessibility compliance
5. THE Home_Screen SHALL use border radius, padding, and shadow values from named constants in the theme constants file; no inline or hardcoded values SHALL appear in component styles
