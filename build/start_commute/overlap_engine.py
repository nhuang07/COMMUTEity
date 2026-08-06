"""
Compares two users' geohash+timestamp checkpoint sequences and scores
how much their commutes actually overlapped in space AND time.

This is the piece that runs as a Lambda in production, triggered
whenever a new check-in session finishes. For now it's pure logic you
can test locally before wiring it to DynamoDB/Lambda.
"""

from geohash_utils import checkpoint_sequence


def score_overlap(sequence_a, sequence_b, time_tolerance_seconds: int = 120):
    """
    sequence_a, sequence_b: lists of {"geohash": str, "ts": int}

    Returns a dict:
      {
        "shared_cells": int,          # how many cells matched within the time window
        "overlap_ratio": float,       # shared_cells / min(len(a), len(b)), 0-1
        "matched_pairs": [...]        # the actual matching points, for debugging/demo
      }

    Two points "overlap" if they're in the same geohash cell AND their
    timestamps are within time_tolerance_seconds of each other — this
    stops us matching two people who happened to pass through the same
    spot hours apart.
    """
    matched_pairs = []

    for point_a in sequence_a:
        for point_b in sequence_b:
            if point_a["geohash"] != point_b["geohash"]:
                continue
            if abs(point_a["ts"] - point_b["ts"]) <= time_tolerance_seconds:
                matched_pairs.append((point_a, point_b))
                break  # don't double-count point_a against multiple point_b's

    shortest_len = min(len(sequence_a), len(sequence_b)) or 1
    overlap_ratio = len(matched_pairs) / shortest_len

    return {
        "shared_cells": len(matched_pairs),
        "overlap_ratio": round(overlap_ratio, 3),
        "matched_pairs": matched_pairs,
    }


# threshold you'll tune during the day — start here, adjust after seeing
# real seeded-data results
MATCH_THRESHOLD = 0.5


def is_match(overlap_result) -> bool:
    return overlap_result["overlap_ratio"] >= MATCH_THRESHOLD


if __name__ == "__main__":
    # Simulate two people on the same 99 B-Line around 8:15am,
    # pinged every ~60 seconds along a shared path.
    user_a_raw = [
        {"lat": 49.2258, "lon": -123.0016, "ts": 1723000000},  # Metrotown-ish
        {"lat": 49.2350, "lon": -123.0400, "ts": 1723000090},
        {"lat": 49.2500, "lon": -123.1200, "ts": 1723000300},
        {"lat": 49.2606, "lon": -123.2460, "ts": 1723000600},  # UBC
    ]

    user_b_raw = [
        {"lat": 49.2258, "lon": -123.0016, "ts": 1723000030},  # boarded ~30s later
        {"lat": 49.2350, "lon": -123.0400, "ts": 1723000110},
        {"lat": 49.2500, "lon": -123.1200, "ts": 1723000330},
        {"lat": 49.2606, "lon": -123.2460, "ts": 1723000640},
    ]

    user_c_raw = [
        {"lat": 49.1900, "lon": -122.8490, "ts": 1723000000},  # Surrey, unrelated
        {"lat": 49.2000, "lon": -122.9000, "ts": 1723000300},
        {"lat": 49.2100, "lon": -122.9500, "ts": 1723000600},
    ]

    seq_a = checkpoint_sequence(user_a_raw)
    seq_b = checkpoint_sequence(user_b_raw)
    seq_c = checkpoint_sequence(user_c_raw)

    result_ab = score_overlap(seq_a, seq_b)
    result_ac = score_overlap(seq_a, seq_c)

    print("A vs B (should overlap heavily):", result_ab)
    print("Is match:", is_match(result_ab))
    print()
    print("A vs C (should not overlap):", result_ac)
    print("Is match:", is_match(result_ac))
