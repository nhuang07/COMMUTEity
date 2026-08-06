#!/usr/bin/env python3
"""
COMMUTEity — load seed-demo-accounts.json into DynamoDB

Reads ../data/seed-demo-accounts.json (from generate-seed-data.py) and
writes the users into the Users table and sessions into CommuteSessions,
using boto3's resource API so item formatting is handled automatically.

Usage:
    python3 load-seed-data.py
"""

import json
import boto3
from decimal import Decimal

REGION = "us-east-1"
SEED_PATH = "../data/seed-demo-accounts.json"
USERS_TABLE = "Users"
SESSIONS_TABLE = "CommuteSessions"
BATCH_SIZE = 25  # DynamoDB batch_writer handles batching internally, but
                  # keeping this documented since it's the hard API limit


def to_decimal(obj):
    """DynamoDB's boto3 resource API requires Decimal instead of float/int
    for numeric types in some paths — this walks the structure and converts.
    Our data is already all ints (epoch seconds), so this is mostly a
    defensive no-op, but cheap insurance against a future float creeping in."""
    if isinstance(obj, list):
        return [to_decimal(x) for x in obj]
    if isinstance(obj, dict):
        return {k: to_decimal(v) for k, v in obj.items()}
    if isinstance(obj, float):
        return Decimal(str(obj))
    return obj


def main():
    with open(SEED_PATH) as f:
        data = json.load(f)

    users = data["users"]
    sessions = data["sessions"]

    dynamodb = boto3.resource("dynamodb", region_name=REGION)
    users_table = dynamodb.Table(USERS_TABLE)
    sessions_table = dynamodb.Table(SESSIONS_TABLE)

    print(f"Writing {len(users)} users to {USERS_TABLE}...")
    with users_table.batch_writer() as batch:
        for u in users:
            batch.put_item(Item=to_decimal(u))

    print(f"Writing {len(sessions)} sessions to {SESSIONS_TABLE}...")
    with sessions_table.batch_writer() as batch:
        for s in sessions:
            batch.put_item(Item=to_decimal(s))

    print("Done. Verify with:")
    print(f"  aws dynamodb scan --table-name {USERS_TABLE} --region {REGION} --select COUNT")
    print(f"  aws dynamodb scan --table-name {SESSIONS_TABLE} --region {REGION} --select COUNT")


if __name__ == "__main__":
    main()