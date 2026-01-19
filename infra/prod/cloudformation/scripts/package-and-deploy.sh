#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   CFN_BUCKET=... STACK_NAME=nexsa-prod HOSTED_ZONE_ID=... DOMAIN_NAME=api.nexsa.social ./infra/prod/cloudformation/scripts/package-and-deploy.sh

CFN_BUCKET="${CFN_BUCKET:?Set CFN_BUCKET (S3 bucket for CFN artifacts)}"
STACK_NAME="${STACK_NAME:-nexsa-prod}"
HOSTED_ZONE_ID="${HOSTED_ZONE_ID:?Set HOSTED_ZONE_ID (Route53 hosted zone id for nexsa.social)}"
DOMAIN_NAME="${DOMAIN_NAME:-api.nexsa.social}"
REGION="${AWS_REGION:-${REGION:-}}"

REGION_ARGS=()
if [[ -n "${REGION}" ]]; then
  REGION_ARGS=(--region "${REGION}")
fi

OUT_FILE="/tmp/${STACK_NAME}.packaged.yaml"

aws cloudformation package \
  "${REGION_ARGS[@]}" \
  --template-file infra/prod/cloudformation/root.yaml \
  --s3-bucket "${CFN_BUCKET}" \
  --output-template-file "${OUT_FILE}"

aws cloudformation deploy \
  "${REGION_ARGS[@]}" \
  --template-file "${OUT_FILE}" \
  --stack-name "${STACK_NAME}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    HostedZoneId="${HOSTED_ZONE_ID}" \
    DomainName="${DOMAIN_NAME}"

echo "Deployed stack: ${STACK_NAME}"


