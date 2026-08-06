"""
Lambda handler: POST /match/opt-in
Thin wrapper around opt_in_logic.process_opt_in() — reads current state
from DynamoDB, runs the tested decision logic, writes it back.
"""

import json
import boto3

from opt_in_logic import process_opt_in

dynamodb = boto3.resource("dynamodb")
overlap_table = dynamodb.Table("OverlapScores")


def handler(event, context):
    body = json.loads(event["body"])
    pair_id = body["pair_id"]
    user_id = body["user_id"]
    opted_in = body["opted_in"]

    user_a, user_b = pair_id.split("#")

    item = overlap_table.get_item(Key={"pair_id": pair_id}).get("Item", {})

    pair_state = {
        "user_a": user_a,
        "user_a_opted_in": item.get("user_a_opted_in"),
        "user_b": user_b,
        "user_b_opted_in": item.get("user_b_opted_in"),
    }

    updated = process_opt_in(
        pair_state, responding_user_id=user_id,
        other_user_id=user_b if user_id == user_a else user_a,
        opted_in=opted_in,
    )

    overlap_table.update_item(
        Key={"pair_id": pair_id},
        UpdateExpression="SET user_a_opted_in = :a, user_b_opted_in = :b",
        ExpressionAttributeValues={
            ":a": updated["user_a_opted_in"],
            ":b": updated["user_b_opted_in"],
        },
    )

    return {
        "statusCode": 200,
        "body": json.dumps({"mutual_match": updated["mutual_match"]}),
    }
