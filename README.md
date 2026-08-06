# COMMUTEity

Find the friends you're already making the same trip as.

Commuter students often struggle with making friends on campus. COMUTEity is a mobile app that helps these students build authentic connections by connecting them with other students taking the same commute as them. No matchmaking survey, no forced social interactions. Just the fact that "you two are taking the same route."

## The problem

Commuter students dont have much exposure to social interactions outside of classes as they usually don't have much of an opportunity to stick around campus after their classes. There's no dorm
hallway, no dining hall, nothing that naturally allows them to meet new people. Meanwhile, dozens of students are likely making the exact same trip every day without ever realizing it.

## How it works

1. **Learn your route.** The app learns your commute over several days, you just click start at the beginning of your commute and it tracks your commute to find your average commute route
2. **Surface your overlap.** We find other students already on the same route or a similar route and surface them as a suggestion.
3. **Opt in, together.** Nothing is shared, no name, no social link, until *both* people opt in. There's no in-app chat; once you're both in, you connect on your own terms on your preferred social media platform.

## Architecture

```
React Native app
      │
      ▼
Amazon Cognito ───── auth (sign up / sign in, JWT)
      │
      ▼
API → AWS Lambda (/commute/end)
      │
      ├── DynamoDB ── CommuteSessions, OverlapScores, Users
      │
      └── Amazon Bedrock (Claude Sonnet 4.5) ── generates a human
            explanation of *why* two users matched
```

The matching Lambda is synchronous: on `/commute/end`, it marks the session complete, scans other completed sessions, runs a pairwise overlap comparison, and returns any new matches — plus a Bedrock-generated explanation — in the same response.

## Tech stack

| Layer          | Tech |
        |---|---|
| Mobile app     | React Native (Expo) |
| Auth           | Amazon Cognito |
| Database       | Amazon DynamoDB |
| Compute        | AWS Lambda |
| AI             | Amazon Bedrock (Claude Sonnet 4.5, via `us.` inference profile) |
| Reference data | TransLink GTFS static feed |

