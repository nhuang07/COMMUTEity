#!/bin/bash
# Deploys a single Lambda function, bundling backend/shared/*.py alongside
# the handler so imports resolve correctly.
#
# Usage: ./deploy-lambda.sh start_commute
#        ./deploy-lambda.sh end_commute
#        ./deploy-lambda.sh opt_in

set -e  # stop immediately if any command fails, don't deploy half-broken

FUNCTION_NAME=$1
if [ -z "$FUNCTION_NAME" ]; then
  echo "Usage: ./deploy-lambda.sh <function_name>"
  echo "e.g. ./deploy-lambda.sh start_commute"
  exit 1
fi

BUILD_DIR="build/$FUNCTION_NAME"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Copy the handler and every shared module into one flat folder
cp "backend/functions/$FUNCTION_NAME/handler.py" "$BUILD_DIR/"
cp backend/shared/*.py "$BUILD_DIR/"

cd "$BUILD_DIR"
zip -r "../${FUNCTION_NAME}.zip" . > /dev/null
cd ../..

echo "Packaged: build/${FUNCTION_NAME}.zip"

# Try to update an existing function first; if it doesn't exist yet, create it.
if aws lambda get-function --function-name "commutity-$FUNCTION_NAME" > /dev/null 2>&1; then
  echo "Updating existing function..."
  aws lambda update-function-code \
    --function-name "commutity-$FUNCTION_NAME" \
    --zip-file "fileb://build/${FUNCTION_NAME}.zip"
else
  echo "Function doesn't exist yet — creating it."
  if [ -z "$LAMBDA_EXECUTION_ROLE_ARN" ]; then
    echo "ERROR: set LAMBDA_EXECUTION_ROLE_ARN first, e.g.:"
    echo 'export LAMBDA_EXECUTION_ROLE_ARN=arn:aws:iam::772171564154:role/commuteity-lambda-execution-role'
    exit 1
  fi
  aws lambda create-function \
    --function-name "commutity-$FUNCTION_NAME" \
    --runtime python3.12 \
    --handler handler.handler \
    --role "$LAMBDA_EXECUTION_ROLE_ARN" \
    --zip-file "fileb://build/${FUNCTION_NAME}.zip" \
    --timeout 15
fi

echo "Done: commutity-$FUNCTION_NAME"
