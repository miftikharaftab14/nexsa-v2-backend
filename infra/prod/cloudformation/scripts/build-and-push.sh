#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   STACK_NAME=nexsa-prod IMAGE_TAG=latest ./infra/prod/cloudformation/scripts/build-and-push.sh

STACK_NAME="${STACK_NAME:-nexsa-prod}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
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

REPO_URI="$(get_output EcrRepositoryUri)"

aws ecr get-login-password "${REGION_ARGS[@]}" | docker login --username AWS --password-stdin "$(echo "${REPO_URI}" | cut -d/ -f1)"

docker build -t "${REPO_URI}:${IMAGE_TAG}" .
docker push "${REPO_URI}:${IMAGE_TAG}"

echo "Pushed image: ${REPO_URI}:${IMAGE_TAG}"


