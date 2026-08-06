const API_BASE = "https://yghhlhf8te.execute-api.us-east-1.amazonaws.com";

async function post(path: string, body: object): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error((data.message as string) || `API error ${res.status}`);
  }
  return data;
}

export async function createProfile(params: {
  userId: string;
  email: string;
  homeArea: string;
  destination: string;
  socials?: { instagram?: string; linkedin?: string; discord?: string };
}): Promise<void> {
  await post("/profile", {
    user_id: params.userId,
    email: params.email,
    home_area: params.homeArea,
    destination: params.destination,
    socials: params.socials ?? {},
  });
}

export async function startCommute(userId: string): Promise<string> {
  const data = await post("/commute/start", { user_id: userId });
  return data.session_id as string;
}

export interface Checkpoint {
  geohash: string;
  timestamp: string;
}

export interface CommuteNotification {
  pair_id: string;
  other_user_id: string;
  text: string;
}

export async function endCommute(params: {
  userId: string;
  sessionId: string;
  checkpoints: Checkpoint[];
}): Promise<CommuteNotification[]> {
  // Backend expects { geohash, ts } where ts is unix seconds
  const backendCheckpoints = params.checkpoints.map((cp) => ({
    geohash: cp.geohash,
    ts: Math.floor(new Date(cp.timestamp).getTime() / 1000),
  }));
  const data = await post("/commute/end", {
    user_id: params.userId,
    session_id: params.sessionId,
    checkpoints: backendCheckpoints,
  });
  return (data.notifications as CommuteNotification[]) ?? [];
}

export async function optIn(params: {
  userId: string;
  pairId: string;
  optedIn: boolean;
}): Promise<boolean> {
  const data = await post("/match/opt-in", {
    user_id: params.userId,
    pair_id: params.pairId,
    opted_in: params.optedIn,
  });
  return data.mutual_match as boolean;
}
