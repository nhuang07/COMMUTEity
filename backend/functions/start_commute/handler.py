"""
Lambda handler: POST /commute/start
Creates a new active session and returns its ID for the frontend to
reference when the commute ends.
"""

import json
import time
import uuid
import boto3

dynamodb = boto3.resource("dynamodb")
sessions_table = dynamodb.Table("CommuteSessions")


def handler(event, context):
    body = json.loads(event["body"])
    user_id = body["user_id"]
    session_id = str(uuid.uuid4())
    now = int(time.time())

    sessions_table.put_item(Item={
        "user_id": user_id,
        "session_id": session_id,
        "status": "active",
        "checkpoints": [],
        "started_at": now,
    })

    return {
        "statusCode": 200,
        "body": json.dumps({"session_id": session_id}),
    }
