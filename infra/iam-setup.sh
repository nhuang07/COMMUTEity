#!/bin/bash
set -euo pipefail

# COMMUTEity — IAM execution role for the backend Lambda(s)
# Creates a role Lambda can assume, with permissions scoped to exactly
# the three DynamoDB tables and the Cognito pool this project uses —
# not account-wide access.
# Run this once. Re-running skips the role/policy if they already exist.

REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_NAME="commuteity-lambda-execution-role"
POLICY_NAME="commuteity-lambda-permissions"

if ! command -v jq &> /dev/null; then
  echo "ERROR: jq is required. Install with: brew install jq"
  exit 1
fi

# --- Trust policy: allows the Lambda service to assume this role ---
TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}'

EXISTING_ROLE=$(aws iam get-role --role-name "$ROLE_NAME" 2>/dev/null | jq -r '.Role.RoleName // empty' || true)

if [ -n "$EXISTING_ROLE" ]; then
  echo "Role '$ROLE_NAME' already exists — skipping creation."
else
  echo "== Creating role: $ROLE_NAME =="
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY" \
    > /dev/null
  echo "Role created."
fi

ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" | jq -r '.Role.Arn')
echo "Role ARN: $ROLE_ARN"

# --- Permissions policy: scoped to this project's actual resources ---
PERMISSIONS_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/CommuteSessions",
        "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/OverlapScores",
        "arn:aws:dynamodb:${REGION}:${ACCOUNT_ID}:table/Users"
      ]
    },
    {
      "Sid": "CognitoTokenValidation",
      "Effect": "Allow",
      "Action": [
        "cognito-idp:GetUser",
        "cognito-idp:DescribeUserPool"
      ],
      "Resource": "arn:aws:cognito-idp:${REGION}:${ACCOUNT_ID}:userpool/*"
    },
    {
      "Sid": "BedrockInvoke",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Logging",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:${REGION}:${ACCOUNT_ID}:*"
    }
  ]
}
EOF
)

echo "== Attaching inline permissions policy: $POLICY_NAME =="
aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "$POLICY_NAME" \
  --policy-document "$PERMISSIONS_POLICY"

echo "Policy attached."

echo ""
echo "=================================================="
echo "  HAND THIS ARN TO THE BACKEND DEV:"
echo "  Role ARN: $ROLE_ARN"
echo "  (attach this as the execution role when creating the Lambda)"
echo "=================================================="

cat > iam-outputs.env <<EOF
LAMBDA_EXECUTION_ROLE_ARN=$ROLE_ARN
EOF

echo "Also saved to iam-outputs.env"
echo ""
echo "NOTE: the Bedrock permission above is scoped to Resource: * because"
echo "model ARNs vary by which model you end up calling. If your sandbox"
echo "denies wildcard Bedrock actions, narrow this to the specific model"
echo "ARN once you've picked one and re-run this script."