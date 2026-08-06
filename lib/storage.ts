export interface StoredProfile {
  displayName: string;
  homeArea: string;
  destination: string;
  faculty?: string;
  year?: string;
  socials?: {
    instagram?: string;
    linkedin?: string;
    discord?: string;
  };
}

export interface MatchNotification {
  pairId: string;
  otherUserId: string;
  text: string;
  status: "pending" | "accepted" | "rejected" | "connected";
}

let _userId: string | null = null;
let _email: string | null = null;
let _pendingEmail: string | null = null;
let _profile: StoredProfile | null = null;
let _notifications: MatchNotification[] = [];

export async function getUserId(): Promise<string | null> {
  return _userId;
}

export function setUserId(id: string): void {
  _userId = id;
}

export function clearSession(): void {
  _userId = null;
  _email = null;
  _profile = null;
  _notifications = [];
}

export function getUserEmail(): string | null {
  return _email;
}

export function setUserEmail(email: string): void {
  _email = email;
}

export function getPendingEmail(): string | null {
  return _pendingEmail;
}

export function setPendingEmail(email: string | null): void {
  _pendingEmail = email;
}

export function getProfile(): StoredProfile | null {
  return _profile;
}

export function setProfile(profile: StoredProfile): void {
  _profile = profile;
}

export function getNotifications(): MatchNotification[] {
  return [..._notifications];
}

export function addNotifications(
  newNotifs: Array<{ pair_id: string; other_user_id: string; text: string }>
): void {
  for (const n of newNotifs) {
    if (!_notifications.find((x) => x.pairId === n.pair_id)) {
      _notifications.push({
        pairId: n.pair_id,
        otherUserId: n.other_user_id,
        text: n.text,
        status: "pending",
      });
    }
  }
}

export function updateNotificationStatus(
  pairId: string,
  status: MatchNotification["status"]
): void {
  const n = _notifications.find((x) => x.pairId === pairId);
  if (n) n.status = status;
}
