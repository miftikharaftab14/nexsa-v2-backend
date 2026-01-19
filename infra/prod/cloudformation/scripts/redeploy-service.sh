#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   STACK_NAME=nexsa-prod ./infra/prod/cloudformation/scripts/redeploy-service.sh

STACK_NAME="${STACK_NAME:-nexsa-prod}"
REGION="${AWS_REGION:-${REGION:-}}"

REGION_ARGS=()
if [[ -n "${REGION}" ]]; then
  REGION_ARGS=(--region "${REGION}")
fi

get_output () {
  local key="$1"
  aws cloudformation describe-stacks \
    "${REGION_ARGS[@]}" \
    --stack-name "${STACK_NAME}" \
    --query "Stacks[0].Outputs[?OutputKey=='${key}'].OutputValue | [0]" \
    --output text
}

CLUSTER="$(get_output EcsClusterName)"
SERVICE="$(get_output EcsServiceName)"

aws ecs update-service \
  "${REGION_ARGS[@]}" \
  --cluster "${CLUSTER}" \
  --service "${SERVICE}" \
  --force-new-deployment

echo "Triggered new deployment for service ${SERVICE} in cluster ${CLUSTER}"


