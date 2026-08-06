"""
Pure matching logic, no AWS dependency. The Lambda handler is just a
thin wrapper that fetches real data from DynamoDB and hands it to
find_matches() below. This lets you fully test the decision-making
today, before any AWS infrastructure exists.
"""

from overlap_engine import score_overlap, is_match


def pair_id(user_a: str, user_b: str) -> str:
    a, b = sorted([user_a, user_b])
    return f"{a}#{b}"


def find_matches(my_user_id: str, my_checkpoints: list, other_sessions: list,
                  already_notified_pairs: set):
    """
    my_checkpoints: this user's just-completed session, e.g.
        [{"geohash": "c2b272e", "ts": 1723000000}, ...]

    other_sessions: list of other users' completed sessions, e.g.
        [{"user_id": "bob", "checkpoints": [...]}, ...]

    already_notified_pairs: set of pair_ids that have already fired a
        notification before, e.g. {"alex#nicholas"}

    Returns: list of NEW matches that should trigger a notification:
        [{"other_user_id": "bob", "result": {...}, "pair_id": "..."}]
    """
    new_matches = []

    for other in other_sessions:
        other_user_id = other["user_id"]
        result = score_overlap(my_checkpoints, other["checkpoints"])

        if not is_match(result):
            continue

        pid = pair_id(my_user_id, other_user_id)
        if pid in already_notified_pairs:
            continue  # already told them about this pair before

        new_matches.append({
            "other_user_id": other_user_id,
            "result": result,
            "pair_id": pid,
        })

    return new_matches


if __name__ == "__main__":
    # Fully local test — proves the decision logic end-to-end with zero AWS
    from geohash_utils import checkpoint_sequence

    my_route = checkpoint_sequence([
        {"lat": 49.2258, "lon": -123.0016, "ts": 1723000000},
        {"lat": 49.2350, "lon": -123.0400, "ts": 1723000090},
        {"lat": 49.2606, "lon": -123.2460, "ts": 1723000600},
    ])

    alex_route = checkpoint_sequence([
        {"lat": 49.2258, "lon": -123.0016, "ts": 1723000030},
        {"lat": 49.2350, "lon": -123.0400, "ts": 1723000110},
        {"lat": 49.2606, "lon": -123.2460, "ts": 1723000640},
    ])

    sam_route = checkpoint_sequence([  # unrelated commute
        {"lat": 49.1900, "lon": -122.8490, "ts": 1723000000},
        {"lat": 49.2000, "lon": -122.9000, "ts": 1723000300},
    ])

    other_sessions = [
        {"user_id": "alex", "checkpoints": alex_route},
        {"user_id": "sam", "checkpoints": sam_route},
    ]

    matches = find_matches(
        my_user_id="nicholas",
        my_checkpoints=my_route,
        other_sessions=other_sessions,
        already_notified_pairs=set(),
    )

    print("New matches found:", len(matches))
    for m in matches:
        print(f"  - matched with {m['other_user_id']}, "
              f"overlap_ratio={m['result']['overlap_ratio']}, "
              f"pair_id={m['pair_id']}")

    # Run it again with alex already notified — should find nothing new
    matches_again = find_matches(
        my_user_id="nicholas",
        my_checkpoints=my_route,
        other_sessions=other_sessions,
        already_notified_pairs={"alex#nicholas"},
    )
    print("\nSecond run (alex already notified):", len(matches_again), "new matches")
