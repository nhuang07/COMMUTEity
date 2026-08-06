#!/bin/bash
set -euo pipefail

# COMMUTEity — Cognito setup
# Creates a User Pool + public App Client for the React Native app.
# Run this once. Re-running will create duplicate pools, so check
# `aws cognito-idp list-user-pools --max-results 20` first if unsure.

REGION="us-east-1"   
POOL_NAME="commuteity-users"
CLIENT_NAME="commuteity-mobile-client"

if ! command -v jq &> /dev/null; then
  echo "ERROR: jq is required (used to parse AWS CLI JSON output reliably)."
  echo "Install with: brew install jq   (or apt-get install jq on Linux)"
  exit 1
fi

# Guard against creating a duplicate pool if this has already been run.
EXISTING_POOL_ID=$(aws cognito-idp list-user-pools --max-results 20 --region "$REGION" \
  | jq -r ".UserPools[] | select(.Name==\"$POOL_NAME\") | .Id")

if [ -n "$EXISTING_POOL_ID" ]; then
  echo "A pool named '$POOL_NAME' already exists: $EXISTING_POOL_ID"
  echo "Not creating a duplicate. Delete it first if you actually want a fresh one:"
  echo "  aws cognito-idp delete-user-pool --user-pool-id $EXISTING_POOL_ID --region $REGION"
  exit 1
fi

echo "== Creating Cognito User Pool: $POOL_NAME (region: $REGION) =="

# NOTE: auto_verified_attributes is intentionally omitted — that requires
# SES to actually deliver verification emails, which isn't set up and
# isn't worth setting up for a 6-hour demo. Users can sign up and sign in
# immediately without a verification step.
POOL_JSON=$(aws cognito-idp create-user-pool \
  --pool-name "$POOL_NAME" \
  --region "$REGION" \
  --username-attributes email \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": false
    }
  }' \
  --schema '[
    {"Name":"email","AttributeDataType":"String","Required":true,"Mutable":true}
  ]')

POOL_ID=$(echo "$POOL_JSON" | jq -r '.UserPool.Id')
echo "User Pool ID: $POOL_ID"

echo "== Creating public App Client (no secret — required for RN) =="

CLIENT_JSON=$(aws cognito-idp create-user-pool-client \
  --user-pool-id "$POOL_ID" \
  --client-name "$CLIENT_NAME" \
  --region "$REGION" \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH)

CLIENT_ID=$(echo "$CLIENT_JSON" | jq -r '.UserPoolClient.ClientId')
echo "App Client ID: $CLIENT_ID"

echo ""
echo "=================================================="
echo "  HAND THESE TO THE FRONTEND DEV:"
echo "  Region:    $REGION"
echo "  Pool ID:   $POOL_ID"
echo "  Client ID: $CLIENT_ID"
echo "=================================================="

# Save to a local file too, so it's not just terminal scrollback
cat > cognito-outputs.env <<EOF
COGNITO_REGION=$REGION
COGNITO_USER_POOL_ID=$POOL_ID
COGNITO_CLIENT_ID=$CLIENT_ID
EOF

echo "Also saved to cognito-outputs.env"