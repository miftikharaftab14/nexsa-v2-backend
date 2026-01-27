#!/bin/bash

set -e

# Configuration
AWS_PROFILE="nexsa"
AWS_REGION="us-east-2"
AWS_ACCOUNT_ID="430118817958"
ECR_REPOSITORY="nexsa-v2-backend"
IMAGE_TAG="${1:-latest}"

REPOSITORY_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}"

echo "🔐 Logging in to Amazon ECR..."
aws ecr get-login-password --region ${AWS_REGION} --profile ${AWS_PROFILE} | \
  docker login --username AWS --password-stdin ${REPOSITORY_URI}

echo "🏗️  Building Docker image for linux/amd64 platform..."
docker build --platform linux/amd64 -t ${REPOSITORY_URI}:${IMAGE_TAG} .

echo "📦 Tagging image..."
docker tag ${REPOSITORY_URI}:${IMAGE_TAG} ${REPOSITORY_URI}:latest

echo "🚀 Pushing image to ECR..."
docker push ${REPOSITORY_URI}:${IMAGE_TAG}
docker push ${REPOSITORY_URI}:latest

echo "✅ Build and push completed!"
echo "   Image URI: ${REPOSITORY_URI}:${IMAGE_TAG}"
echo "   Image URI: ${REPOSITORY_URI}:latest"
