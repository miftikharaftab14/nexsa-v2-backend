# Nexsa V2 - CloudFormation (lowest-cost prod)

This folder contains a **nested CloudFormation** setup for:
- **ECR** (container registry)
- **ECS on EC2** (single-instance/ single-task baseline)
- **RDS Postgres** (single-AZ)
- **ALB + ACM + Route53** for HTTPS on `api.nexsa.social`

## Templates
- `root.yaml`: root stack that references all nested stacks
- `network.yaml`: VPC + subnets + routing (public subnets for ALB/ECS, private DB subnets)
- `security.yaml`: security groups + IAM roles
- `ecr.yaml`: ECR repository + lifecycle
- `rds.yaml`: RDS Postgres + Secrets Manager password
- `alb-acm-route53.yaml`: ACM cert + ALB listeners + Route53 alias record
- `ecs.yaml`: ECS cluster + ASG + task definitions + service
- `observability.yaml`: CloudWatch Log Group

## Prerequisites
- AWS CLI configured for the target account/region
- An S3 bucket for packaging CloudFormation nested templates
- Route 53 hosted zone for `nexsa.social` in the same AWS account

## Deploy (package + deploy)
CloudFormation nested stacks require the child templates be uploaded to S3. Use `aws cloudformation package`:

```bash
aws cloudformation package \
  --template-file infra/prod/cloudformation/root.yaml \
  --s3-bucket YOUR_CFN_ARTIFACT_BUCKET \
  --output-template-file /tmp/nexsa-root.packaged.yaml

aws cloudformation deploy \
  --template-file /tmp/nexsa-root.packaged.yaml \
  --stack-name nexsa-prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    HostedZoneId=YOUR_HOSTED_ZONE_ID \
    DomainName=api.nexsa.social
```

### Helper script

```bash
chmod +x infra/prod/cloudformation/scripts/*.sh
CFN_BUCKET=YOUR_CFN_ARTIFACT_BUCKET HOSTED_ZONE_ID=YOUR_HOSTED_ZONE_ID STACK_NAME=nexsa-prod \
  ./infra/prod/cloudformation/scripts/package-and-deploy.sh
```

## Deploy container to ECS
1) Build and push your Docker image to the ECR repo output by the stack.

2) Update the ECS service (new task definition revision using the pushed image tag).

### Helper script (build + push)

```bash
STACK_NAME=nexsa-prod IMAGE_TAG=latest ./infra/prod/cloudformation/scripts/build-and-push.sh
```

### Trigger a new deployment (pull latest image)

```bash
STACK_NAME=nexsa-prod ./infra/prod/cloudformation/scripts/redeploy-service.sh
```

## Run DB migrations (one-off task)
The ECS stack defines a **migration task definition** that runs `npm run migration:run:prod`.
Run it during deploys:

```bash
aws ecs run-task \
  --cluster CLUSTER_NAME_FROM_STACK_OUTPUT \
  --task-definition MIGRATION_TASK_DEFINITION_ARN_FROM_STACK_OUTPUT \
  --launch-type EC2 \
  --network-configuration "awsvpcConfiguration={subnets=[PUBLIC_SUBNET_A,PUBLIC_SUBNET_B],securityGroups=[ECS_SG],assignPublicIp=ENABLED}"
```

### Helper script (run migrations)

```bash
STACK_NAME=nexsa-prod ./infra/prod/cloudformation/scripts/run-migrations.sh
```

## Notes / tradeoffs
- This is **lowest cost**: ECS tasks are in public subnets (no NAT) and the service runs **1 instance/1 task**.
- You may have brief downtime during deployments.
- Upgrade path: set ASG desired=2 and service desired=2 for better reliability.


