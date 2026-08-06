#!/bin/bash
set -euo pipefail

# COMMUTEity — DynamoDB setup
# Creates CommuteSessions, OverlapScores, and Users tables.
# See dynamodb-schema.md for the full attribute reference.
# On-demand billing, no GSIs (matching is a full scan — see schema doc for why).
# Run this once. Re-running skips tables that already exist.

REGION="us-east-1"   # must match Cognito/Bedrock region

if ! command -v jq &> /dev/null; then
  echo "ERROR: jq is required. Install with: brew install jq"
  exit 1
fi

create_table_if_missing() {
  local TABLE_NAME=$1
  shift
  local KEY_SCHEMA=("$@")

  EXISTING=$(aws dynamodb list-tables --region "$REGION" | jq -r ".TableNames[] | select(. == \"$TABLE_NAME\")")

  if [ -n "$EXISTING" ]; then
    echo "Table '$TABLE_NAME' already exists — skipping."
    return
  fi

  echo "Creating table: $TABLE_NAME"
  aws dynamodb create-table \
    --table-name "$TABLE_NAME" \
    --region "$REGION" \
    --billing-mode PAY_PER_REQUEST \
    "${KEY_SCHEMA[@]}" \
    > /dev/null

  echo "  waiting for $TABLE_NAME to become active..."
  aws dynamodb wait table-exists --table-name "$TABLE_NAME" --region "$REGION"
  echo "  $TABLE_NAME is active."
}

echo "== CommuteSessions =="
create_table_if_missing "CommuteSessions" \
  --attribute-definitions AttributeName=user_id,AttributeType=S AttributeName=session_id,AttributeType=S \
  --key-schema AttributeName=user_id,KeyType=HASH AttributeName=session_id,KeyType=RANGE

echo "== OverlapScores =="
create_table_if_missing "OverlapScores" \
  --attribute-definitions AttributeName=pair_id,AttributeType=S \
  --key-schema AttributeName=pair_id,KeyType=HASH

echo "== Users =="
create_table_if_missing "Users" \
  --attribute-definitions AttributeName=user_id,AttributeType=S \
  --key-schema AttributeName=user_id,KeyType=HASH

echo ""
echo "=================================================="
echo "  HAND THESE TABLE NAMES TO THE BACKEND DEV:"
echo "  Region:  $REGION"
echo "  Tables:  CommuteSessions, OverlapScores, Users"
echo "  (no GSIs — matching Lambda does a full scan; see dynamodb-schema.md)"
echo "=================================================="

cat > dynamodb-outputs.env <<EOF
DYNAMODB_REGION=$REGION
TABLE_COMMUTE_SESSIONS=CommuteSessions
TABLE_OVERLAP_SCORES=OverlapScores
TABLE_USERS=Users
EOF

echo "Also saved to dynamodb-outputs.env"