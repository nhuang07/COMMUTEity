#!/bin/bash
# Creates an HTTP API, wires all three Lambda functions to their routes,
# grants API Gateway permission to invoke each, deploys, and writes the
# resulting invoke URL to apigateway-outputs.env
#
# Run from repo root: ./infra/setup-api-gateway.sh

set -e

REGION="us-east-1"
ACCOUNT_ID="772171564154"

echo "Creating HTTP API..."
API_ID=$(aws apigatewayv2 create-api \
  --name commutity-api \
  --protocol-type HTTP \
  --query 'ApiId' --output text)
echo "API created: $API_ID"

# function_name:route_key pairs
ROUTES=(
  "commutity-start_commute:POST /commute/start"
  "commutity-end_commute:POST /commute/end"
  "commutity-opt_in:POST /match/opt-in"
)

for entry in "${ROUTES[@]}"; do
  FUNCTION_NAME="${entry%%:*}"
  ROUTE_KEY="${entry#*:}"
  ROUTE_PATH=$(echo "$ROUTE_KEY" | awk '{print $2}')

  echo ""
  echo "Wiring $FUNCTION_NAME -> $ROUTE_KEY"

  LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}"

  INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id "$API_ID" \
    --integration-type AWS_PROXY \
    --integration-uri "$LAMBDA_ARN" \
    --payload-format-version 2.0 \
    --query 'IntegrationId' --output text)

  aws apigatewayv2 create-route \
    --api-id "$API_ID" \
    --route-key "$ROUTE_KEY" \
    --target "integrations/$INTEGRATION_ID" > /dev/null

  # Allow API Gateway to actually invoke this Lambda
  aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "apigw-invoke-$(echo $ROUTE_PATH | tr '/' '-')" \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*${ROUTE_PATH}" \
    2>/dev/null || echo "  (permission already exists, skipping)"

  echo "  Route wired: $ROUTE_KEY -> $FUNCTION_NAME"
done

echo ""
echo "Deploying default stage (auto-deploy)..."
aws apigatewayv2 create-stage \
  --api-id "$API_ID" \
  --stage-name '$default' \
  --auto-deploy > /dev/null

API_ENDPOINT=$(aws apigatewayv2 get-api --api-id "$API_ID" --query 'ApiEndpoint' --output text)

echo ""
echo "===================================="
echo "API is live at: $API_ENDPOINT"
echo "===================================="

cat > apigateway-outputs.env << EOF
API_ID=$API_ID
API_ENDPOINT=$API_ENDPOINT
EOF

echo "Saved to apigateway-outputs.env"
echo ""
echo "Full endpoints for frontend:"
echo "  POST ${API_ENDPOINT}/commute/start"
echo "  POST ${API_ENDPOINT}/commute/end"
echo "  POST ${API_ENDPOINT}/match/opt-in"
