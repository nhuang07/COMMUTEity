import { MatchCardData } from '../constants/mockData';

export interface GroupedMatches {
  pending: MatchCardData[];
  connected: MatchCardData[];
}

export function groupMatches(matches: MatchCardData[]): GroupedMatches {
  return {
    pending: matches.filter((m) => m.status === 'pending'),
    connected: matches.filter((m) => m.status === 'connected'),
  };
}
