"""
Lambda handler: POST /commute/end

Called when a user taps "end commute." Expects a JSON body:
{
  "user_id": "abc123",
  "session_id": "uuid-from-start-call",
  "checkpoints": [{"geohash": "c2b272e", "ts": 1723000000}, ...]
}

Steps:
1. Mark this session completed in CommuteSessions.
2. Pull other users' recently-completed sessions (last ~2 hours, so we're
   only comparing same-day commutes, not comparing to something from
   3 weeks ago).
3. Score this session against each of them using score_overlap().
4. For any match crossing the threshold, update OverlapScores and — if
   this is a NEW match crossing the threshold for the first time —
   trigger the Bedrock explanation + notification.

NOTE: this is written against standard boto3 patterns but has not been
tested against real AWS from this environment (no credentials/network
access here). Test it against your actual tables before demo day.
"""

import json
import time
import boto3

from overlap_engine import score_overlap, is_match
from generate_explanation import generate_match_explanation

dynamodb = boto3.resource("dynamodb")
sessions_table = dynamodb.Table("CommuteSessions")
overlap_table = dynamodb.Table("OverlapScores")
users_table = dynamodb.Table("Users")

RECENT_WINDOW_SECONDS = 2 * 60 * 60  # only compare against same-day sessions


def pair_id(user_a: str, user_b: str) -> str:
    """Consistent pair key regardless of argument order."""
    a, b = sorted([user_a, user_b])
    return f"{a}#{b}"


def handler(event, context):
    body = json.loads(event["body"])
    user_id = body["user_id"]
    session_id = body["session_id"]
    checkpoints = body["checkpoints"]
    now = int(time.time())

    # 1. Mark this session completed
    sessions_table.update_item(
        Key={"user_id": user_id, "session_id": session_id},
        UpdateExpression="SET #s = :completed, ended_at = :now, checkpoints = :cp",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={
            ":completed": "completed",
            ":now": now,
            ":cp": checkpoints,
        },
    )

    # 2. Pull other users' recent completed sessions
    #    (scan is fine at hackathon scale — a handful of demo users;
    #     swap for a GSI on status+ended_at if this ever needs to scale)
    response = sessions_table.scan(
        FilterExpression="#s = :completed AND ended_at > :cutoff AND user_id <> :me",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={
            ":completed": "completed",
            ":cutoff": now - RECENT_WINDOW_SECONDS,
            ":me": user_id,
        },
    )
    other_sessions = response.get("Items", [])

    new_matches = []

    for other in other_sessions:
        other_user_id = other["user_id"]
        result = score_overlap(checkpoints, other["checkpoints"])

        if not is_match(result):
            continue

        pid = pair_id(user_id, other_user_id)
        existing = overlap_table.get_item(Key={"pair_id": pid}).get("Item")
        already_notified = existing.get("notified", False) if existing else False

        overlap_table.update_item(
            Key={"pair_id": pid},
            UpdateExpression=(
                "SET overlap_count = if_not_exists(overlap_count, :zero) + :one, "
                "last_overlap_ratio = :ratio, last_matched_at = :now"
            ),
            ExpressionAttributeValues={
                ":zero": 0,
                ":one": 1,
                ":ratio": result["overlap_ratio"],
                ":now": now,
            },
        )

        if not already_notified:
            new_matches.append({"other_user_id": other_user_id, "result": result})

    # 3. For brand-new matches only, generate the explanation and mark notified
    notifications = []
    for match in new_matches:
        other_user = users_table.get_item(
            Key={"user_id": match["other_user_id"]}
        ).get("Item", {})
        me = users_table.get_item(Key={"user_id": user_id}).get("Item", {})

        explanation = generate_match_explanation(
            user_a=me, user_b=other_user, overlap_result=match["result"]
        )

        pid = pair_id(user_id, match["other_user_id"])
        overlap_table.update_item(
            Key={"pair_id": pid},
            UpdateExpression="SET notified = :true",
            ExpressionAttributeValues={":true": True},
        )

        notifications.append(
            {"pair_id": pid, "other_user_id": match["other_user_id"], "text": explanation}
        )

    return {
        "statusCode": 200,
        "body": json.dumps({"notifications": notifications}),
    }
