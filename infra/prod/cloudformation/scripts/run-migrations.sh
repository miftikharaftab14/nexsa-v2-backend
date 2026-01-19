#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   STACK_NAME=nexsa-prod ./infra/prod/cloudformation/scripts/run-migrations.sh

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
TASK_DEF_ARN="$(get_output MigrationTaskDefinitionArn)"
SUBNET_A="$(get_output PublicSubnetAId)"
SUBNET_B="$(get_output PublicSubnetBId)"
ECS_SG="$(get_output EcsSecurityGroupId)"

aws ecs run-task \
  "${REGION_ARGS[@]}" \
  --cluster "${CLUSTER}" \
  --task-definition "${TASK_DEF_ARN}" \
  --launch-type EC2 \
  --count 1 \
  --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_A},${SUBNET_B}],securityGroups=[${ECS_SG}],assignPublicIp=ENABLED}"

echo "Started migration task on cluster ${CLUSTER}"


