"""
Lambda handler: POST /commute/end
Thin AWS wrapper around matching_logic.find_matches() and
generate_explanation.generate_match_explanation() — all the actual
decision-making already lives in matching_logic.py and is tested there.
This function's only job is: fetch real data, call the tested logic,
write the result back.
"""

import json
import time
import boto3
from decimal import Decimal

from matching_logic import find_matches
from generate_explanation import generate_match_explanation

dynamodb = boto3.resource("dynamodb")
sessions_table = dynamodb.Table("CommuteSessions")
overlap_table = dynamodb.Table("OverlapScores")
users_table = dynamodb.Table("Users")

RECENT_WINDOW_SECONDS = 2 * 60 * 60


def handler(event, context):
    body = json.loads(event["body"])
    user_id = body["user_id"]
    session_id = body["session_id"]
    checkpoints = body["checkpoints"]
    now = int(time.time())

    # Convert any float values in checkpoints to int for DynamoDB compatibility
    for cp in checkpoints:
        if "ts" in cp:
            cp["ts"] = int(cp["ts"])

    # 1. Mark this session completed
    try:
        sessions_table.update_item(
            Key={"user_id": user_id, "session_id": session_id},
            UpdateExpression="SET #s = :completed, ended_at = :now, checkpoints = :cp",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={
                ":completed": "completed", ":now": now, ":cp": checkpoints,
            },
        )
    except Exception:
        # If session doesn't exist, create it directly
        sessions_table.put_item(Item={
            "user_id": user_id,
            "session_id": session_id,
            "status": "completed",
            "checkpoints": checkpoints,
            "started_at": now,
            "ended_at": now,
        })

    # 2. Fetch other users' recent completed sessions (scan — fine at demo scale)
    scan_result = sessions_table.scan(
        FilterExpression="#s = :completed AND ended_at > :cutoff AND user_id <> :me",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={
            ":completed": "completed",
            ":cutoff": now - RECENT_WINDOW_SECONDS,
            ":me": user_id,
        },
    )
    other_sessions = [
        {"user_id": item["user_id"], "checkpoints": item["checkpoints"]}
        for item in scan_result.get("Items", [])
    ]

    # 3. Fetch which pairs have already been notified, so find_matches can dedupe
    already_notified = set()
    for other in other_sessions:
        pid = "#".join(sorted([user_id, other["user_id"]]))
        existing = overlap_table.get_item(Key={"pair_id": pid}).get("Item")
        if existing and existing.get("notified"):
            already_notified.add(pid)

    # 4. Run the TESTED matching logic — no decision-making happens here
    matches = find_matches(
        my_user_id=user_id,
        my_checkpoints=checkpoints,
        other_sessions=other_sessions,
        already_notified_pairs=already_notified,
    )

    # 5. For each new match: generate explanation, persist, build response
    notifications = []
    for match in matches:
        me = users_table.get_item(Key={"user_id": user_id}).get("Item", {})
        other_user = users_table.get_item(
            Key={"user_id": match["other_user_id"]}
        ).get("Item", {})

        explanation = generate_match_explanation(
            user_a=me, user_b=other_user, overlap_result=match["result"]
        )

        overlap_table.update_item(
            Key={"pair_id": match["pair_id"]},
            UpdateExpression=(
                "SET overlap_count = if_not_exists(overlap_count, :zero) + :one, "
                "last_overlap_ratio = :ratio, last_matched_at = :now, notified = :true"
            ),
            ExpressionAttributeValues={
                ":zero": 0, ":one": 1,
                ":ratio": Decimal(str(match["result"]["overlap_ratio"])),
                ":now": now, ":true": True,
            },
        )

        notifications.append({
            "pair_id": match["pair_id"],
            "other_user_id": match["other_user_id"],
            "text": explanation,
        })

    return {"statusCode": 200, "body": json.dumps({"notifications": notifications})}
