#!/usr/bin/env python3
"""
COMMUTEity — seed demo data generator

Builds synthetic multi-day commute history along real GTFS shapes, matching
the CommuteSessions / Users DynamoDB item schema exactly, so it can be
loaded straight into the tables for a live demo.

Usage:
    python3 generate-seed-data.py

Reads:  ../data/translink-routes/shapes.txt  (from pull-gtfs.sh)
Writes: ../data/seed-demo-accounts.json
"""

import csv
import json
import random
import uuid
import os
from datetime import datetime, timedelta

GTFS_SHAPES_PATH = "../data/translink-routes/shapes.txt"
OUT_PATH = "../data/seed-demo-accounts.json"

# geohash encoding — small self-contained implementation, no external deps
_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"

def geohash_encode(lat, lon, precision=7):
    lat_range, lon_range = [-90.0, 90.0], [-180.0, 180.0]
    geohash, bit, ch, even = [], 0, 0, True
    while len(geohash) < precision:
        if even:
            mid = (lon_range[0] + lon_range[1]) / 2
            if lon > mid:
                ch |= (1 << (4 - bit)); lon_range[0] = mid
            else:
                lon_range[1] = mid
        else:
            mid = (lat_range[0] + lat_range[1]) / 2
            if lat > mid:
                ch |= (1 << (4 - bit)); lat_range[0] = mid
            else:
                lat_range[1] = mid
        even = not even
        if bit < 4:
            bit += 1
        else:
            geohash.append(_BASE32[ch])
            bit, ch = 0, 0
    return "".join(geohash)


def load_shapes(path):
    """Returns {shape_id: [(lat, lon), ...]} ordered by sequence."""
    shapes = {}
    with open(path, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            sid = row["shape_id"]
            shapes.setdefault(sid, []).append(
                (float(row["shape_pt_lat"]), float(row["shape_pt_lon"]),
                 int(row["shape_pt_sequence"]))
            )
    for sid in shapes:
        shapes[sid].sort(key=lambda p: p[2])
        shapes[sid] = [(lat, lon) for lat, lon, _ in shapes[sid]]
    return shapes


def build_session(user_id, points, day_offset, start_hour=8, jitter=True):
    """One commute session: a session_id, checkpoints walking `points`
    with timestamps spaced a few minutes apart, status completed."""
    session_id = str(uuid.uuid4())
    base_day = datetime(2026, 8, 1) + timedelta(days=day_offset)
    start_time = base_day.replace(hour=start_hour, minute=random.randint(0, 20))
    ts = int(start_time.timestamp())

    checkpoints = []
    for i, (lat, lon) in enumerate(points):
        if jitter:
            lat += random.uniform(-0.0003, 0.0003)
            lon += random.uniform(-0.0003, 0.0003)
        checkpoints.append({
            "geohash": geohash_encode(lat, lon, precision=7),
            "ts": ts + i * random.randint(60, 180),  # 1-3 min between points
        })

    ended_at = checkpoints[-1]["ts"]
    return {
        "user_id": user_id,
        "session_id": session_id,
        "checkpoints": checkpoints,
        "status": "completed",
        "started_at": ts,
        "ended_at": ended_at,
    }


def build_user(user_id, email, home_area, destination):
    return {
        "user_id": user_id,
        "email": email,
        "home_area": home_area,
        "destination": destination,
        "socials": {
            "instagram": f"https://instagram.com/{user_id}",
            "linkedin": f"https://linkedin.com/in/{user_id}",
        },
    }


def main():
    if not os.path.exists(GTFS_SHAPES_PATH):
        print(f"ERROR: {GTFS_SHAPES_PATH} not found. Run pull-gtfs.sh first.")
        return

    shapes = load_shapes(GTFS_SHAPES_PATH)
    if not shapes:
        print("ERROR: no shapes found in the GTFS subset.")
        return

    shape_ids = list(shapes.keys())
    print(f"Loaded {len(shape_ids)} shape(s): {shape_ids}")

    # Use the first shape as the "demo route" — same one your live demo
    # phone will walk during the pitch — and a second (different) shape
    # for unrelated users, if available.
    primary_shape = shapes[shape_ids[0]]
    secondary_shape = shapes[shape_ids[1]] if len(shape_ids) > 1 else None

    users = []
    sessions = []

    # --- Group A: users on the SAME route as the live demo (should match) ---
    for i in range(4):
        uid = f"seed-samematch-{i}"
        users.append(build_user(uid, f"{uid}@student.ubc.ca", "Broadway", "UBC"))
        for day in range(5):  # 5 days of history
            sessions.append(build_session(uid, primary_shape, day_offset=day))

    # --- Group B: users on a DIFFERENT route (should NOT match) ---
    if secondary_shape:
        for i in range(3):
            uid = f"seed-nomatch-{i}"
            users.append(build_user(uid, f"{uid}@student.ubc.ca", "Richmond", "Downtown"))
            for day in range(5):
                sessions.append(build_session(uid, secondary_shape, day_offset=day))

    # --- Group C: one user on a PARTIAL overlap of the primary route
    #     (first half only) — good for demoing the "similarity ratio",
    #     not just binary match/no-match ---
    partial_uid = "seed-partial-0"
    users.append(build_user(partial_uid, f"{partial_uid}@student.ubc.ca", "Broadway", "Kitsilano"))
    half_route = primary_shape[: max(2, len(primary_shape) // 2)]
    for day in range(5):
        sessions.append(build_session(partial_uid, half_route, day_offset=day))

    print(f"Built {len(users)} users, {len(sessions)} sessions.")

    output = {"users": users, "sessions": sessions}
    with open(OUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()