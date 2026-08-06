"""
Lambda handler: POST /profile
Called right after onboarding (and after Cognito signup completes on the
frontend) to write the user's profile into the Users table.
"""

import json
import boto3

dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table("Users")


def handler(event, context):
    body = json.loads(event["body"])

    users_table.put_item(Item={
        "user_id": body["user_id"],
        "email": body["email"],
        "home_area": body["home_area"],
        "destination": body["destination"],
        "socials": body.get("socials", {}),  # optional at onboarding time
    })

    return {"statusCode": 200, "body": json.dumps({"status": "created"})}
