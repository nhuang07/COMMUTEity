export interface Socials {
  instagram?: string;
  linkedin?: string;
  discord?: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  homeArea: string;
  campusDestination: string;
  faculty?: string;
  year?: number;
  socials?: Socials;
}

export interface ScheduleEntry {
  courseName: string;
  time: string; // 24h format "HH:MM" for sorting, displayed in 12h
  location: string;
}

export interface MatchCardData {
  matchId: string;
  overlapExplanation: string;
  sharedWindow: string;
  status: 'pending' | 'connected';
  matchedUser: {
    displayName: string;
    faculty?: string;
    year?: number;
    socials?: Socials;
  };
}

export interface CommuteSessionStatus {
  sessionId: string;
  status: 'active' | 'idle';
}

export interface MatchNotification {
  pairId: string;
  otherUserId: string;
  text: string;
}

export interface OptInResponse {
  mutualMatch: boolean;
}

export interface MatchProfile {
  userId: string;
  name: string;
  faculty?: string;
  year?: number;
  socials?: Socials;
}

export const MOCK_USER: UserProfile = {
  userId: 'user-001',
  displayName: 'Jessica',
  email: 'jessica@student.ubc.ca',
  homeArea: 'Burnaby',
  campusDestination: 'UBC Vancouver',
  faculty: 'Science',
  year: 3,
  socials: {
    instagram: '@jess_commutes',
    linkedin: 'jessica-ubc',
    discord: 'jess#1234',
  },
};

export const MOCK_SCHEDULE: ScheduleEntry[] = [
  { courseName: 'CPSC 310', time: '09:30', location: 'ICCS 104' },
  { courseName: 'MATH 221', time: '13:00', location: 'LSK 200' },
  { courseName: 'STAT 251', time: '15:30', location: 'ESB 1012' },
];

export const MOCK_MATCHES: MatchCardData[] = [
  {
    matchId: 'match-001',
    overlapExplanation:
      'You both travel through the Metrotown area around 8:15 AM on weekdays. Your routes overlap near the 99 B-Line corridor heading toward UBC.',
    sharedWindow: 'Weekdays 8:00–8:45 AM',
    status: 'pending',
    matchedUser: { displayName: 'Alex', faculty: 'Engineering' },
  },
  {
    matchId: 'match-002',
    overlapExplanation:
      'You share a similar commute path along the Canada Line from Richmond, arriving at campus between 9:00 and 9:30 AM.',
    sharedWindow: 'Mon/Wed/Fri 8:45–9:30 AM',
    status: 'connected',
    matchedUser: {
      displayName: 'Sam Chen',
      faculty: 'Arts',
      year: 2,
      socials: { instagram: '@samchen_ubc', discord: 'samC#5678' },
    },
  },
  {
    matchId: 'match-003',
    overlapExplanation:
      'Your afternoon commutes overlap near Broadway-City Hall station around 4 PM on Tuesdays and Thursdays.',
    sharedWindow: 'Tue/Thu 3:45–4:15 PM',
    status: 'pending',
    matchedUser: { displayName: 'Jordan', faculty: 'Science', year: 4 },
  },
];

export const MOCK_COMMUTE_STATUS: CommuteSessionStatus = {
  sessionId: 'session-draft-001',
  status: 'idle',
};
