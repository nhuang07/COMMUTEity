"""
Pure logic for /match/opt-in. Given the current opt-in state of a pair
and which user just responded, decides the new state and whether this
is now a mutual match. No AWS dependency — same pattern as matching_logic.py.
"""


def process_opt_in(pair_state: dict, responding_user_id: str, other_user_id: str,
                    opted_in: bool) -> dict:
    """
    pair_state: current state, e.g.
        {"user_a": "alex", "user_a_opted_in": None,
         "user_b": "nicholas", "user_b_opted_in": None}
        (None = hasn't responded yet, True/False = responded)

    Returns the updated pair_state, plus a "mutual_match" flag.
    """
    updated = dict(pair_state)

    if responding_user_id == updated["user_a"]:
        updated["user_a_opted_in"] = opted_in
    elif responding_user_id == updated["user_b"]:
        updated["user_b_opted_in"] = opted_in
    else:
        raise ValueError("responding_user_id doesn't match either user in this pair")

    mutual_match = (updated["user_a_opted_in"] is True
                     and updated["user_b_opted_in"] is True)

    updated["mutual_match"] = mutual_match
    return updated


if __name__ == "__main__":
    pair = {"user_a": "alex", "user_a_opted_in": None,
            "user_b": "nicholas", "user_b_opted_in": None}

    # Nicholas opts in first — should NOT be a mutual match yet
    pair = process_opt_in(pair, responding_user_id="nicholas",
                           other_user_id="alex", opted_in=True)
    print("After nicholas opts in:", pair)
    assert pair["mutual_match"] is False

    # Alex opts in too — NOW it should be mutual
    pair = process_opt_in(pair, responding_user_id="alex",
                           other_user_id="nicholas", opted_in=True)
    print("After alex opts in:", pair)
    assert pair["mutual_match"] is True

    # Separate scenario: one person declines — should never become mutual
    pair2 = {"user_a": "sam", "user_a_opted_in": None,
             "user_b": "nicholas", "user_b_opted_in": None}
    pair2 = process_opt_in(pair2, responding_user_id="sam",
                            other_user_id="nicholas", opted_in=False)
    pair2 = process_opt_in(pair2, responding_user_id="nicholas",
                            other_user_id="sam", opted_in=True)
    print("Sam declined, nicholas accepted:", pair2)
    assert pair2["mutual_match"] is False

    print("\nAll scenarios passed.")
