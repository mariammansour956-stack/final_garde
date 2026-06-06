#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="us-west-1"
CLUSTER_NAME="shopease-dev-eks"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TERRAFORM_DIR="${PROJECT_ROOT}/terraform"

echo "=================================================="
echo " Stop costly resources"
echo "=================================================="

echo "This script prepares the platform for safe terraform destroy."
echo "It deletes Argo CD apps, Ingress/ALB, waits for ELB resources, and stops Jenkins."
echo ""
read -p "Type yes to continue: " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
  echo "Cancelled."
  exit 0
fi

cd "$PROJECT_ROOT"

echo
echo "==> Updating kubeconfig if cluster still exists"
aws eks update-kubeconfig \
  --region "$AWS_REGION" \
  --name "$CLUSTER_NAME" || true

echo
echo "==> Getting VPC ID from Terraform output"
VPC_ID="$(terraform -chdir="$TERRAFORM_DIR" output -raw vpc_id 2>/dev/null || true)"

if [[ -z "$VPC_ID" ]]; then
  echo "Could not read VPC ID from Terraform output."
  echo "Continuing with Kubernetes cleanup only."
else
  echo "VPC ID: $VPC_ID"
fi

echo
echo "==> Delete Argo CD apps to stop self-healing resources"
kubectl delete application shopease-prod -n argocd --ignore-not-found || true
kubectl delete application karpenter-config -n argocd --ignore-not-found || true

echo
echo "==> Delete production ingress to trigger ALB deletion"
kubectl delete ingress shopease-alb-ingress -n prod --ignore-not-found || true

echo
echo "==> Wait for Kubernetes ingress deletion"
for i in {1..20}; do
  if kubectl get ingress shopease-alb-ingress -n prod >/dev/null 2>&1; then
    echo "Ingress still exists... waiting 15s ($i/20)"
    sleep 15
  else
    echo "Ingress deleted or not found."
    break
  fi
done

if [[ -n "$VPC_ID" ]]; then
  echo
  echo "==> Delete any remaining ALBs in the project VPC"

  ALB_ARNS="$(aws elbv2 describe-load-balancers \
    --region "$AWS_REGION" \
    --query "LoadBalancers[?VpcId=='$VPC_ID'].LoadBalancerArn" \
    --output text 2>/dev/null || true)"

  if [[ -n "$ALB_ARNS" && "$ALB_ARNS" != "None" ]]; then
    for alb in $ALB_ARNS; do
      echo "Deleting ALB: $alb"
      aws elbv2 delete-load-balancer \
        --region "$AWS_REGION" \
        --load-balancer-arn "$alb" || true
    done
  else
    echo "No ALBs found in VPC."
  fi

  echo
  echo "==> Wait for ELB network interfaces to disappear"

  for i in {1..30}; do
    ENIS="$(aws ec2 describe-network-interfaces \
      --region "$AWS_REGION" \
      --filters "Name=vpc-id,Values=$VPC_ID" \
      --query "NetworkInterfaces[?contains(Description, 'ELB')].[NetworkInterfaceId]" \
      --output text 2>/dev/null || true)"

    if [[ -z "$ENIS" || "$ENIS" == "None" ]]; then
      echo "No ELB ENIs found."
      break
    fi

    echo "ELB ENIs still exist: $ENIS"
    echo "Waiting 20s ($i/30)"
    sleep 20
  done

  echo
  echo "==> Show remaining ENIs in VPC"
  aws ec2 describe-network-interfaces \
    --region "$AWS_REGION" \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "NetworkInterfaces[*].[NetworkInterfaceId,Status,Description,SubnetId,Association.PublicIp,Attachment.InstanceId]" \
    --output table || true

  echo
  echo "==> Try deleting Kubernetes-created Load Balancer security groups"

  SG_IDS="$(aws ec2 describe-security-groups \
    --region "$AWS_REGION" \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "SecurityGroups[?GroupName!='default' && (starts_with(GroupName, 'k8s-') || contains(Description, 'LoadBalancer'))].GroupId" \
    --output text 2>/dev/null || true)"

  if [[ -n "$SG_IDS" && "$SG_IDS" != "None" ]]; then
    for sg in $SG_IDS; do
      echo "Deleting SG: $sg"
      aws ec2 delete-security-group \
        --region "$AWS_REGION" \
        --group-id "$sg" || true
    done
  else
    echo "No Kubernetes LoadBalancer security groups found."
  fi

  echo
  echo "==> Remaining Security Groups in VPC"
  aws ec2 describe-security-groups \
    --region "$AWS_REGION" \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "SecurityGroups[*].[GroupId,GroupName,Description]" \
    --output table || true
fi

echo
echo "==> Stop Jenkins locally"
sudo systemctl stop jenkins || true

echo
echo "=================================================="
echo " Stop preparation completed"
echo "=================================================="

echo
echo "Next command to remove AWS infrastructure:"
echo "cd ${TERRAFORM_DIR}"
echo "terraform destroy"

echo
echo "Optional: delete ECR repositories if you want to remove image storage too:"
echo "aws ecr delete-repository --region ${AWS_REGION} --repository-name user-service --force || true"
echo "aws ecr delete-repository --region ${AWS_REGION} --repository-name order-service --force || true"
echo "aws ecr delete-repository --region ${AWS_REGION} --repository-name notification-service --force || true"
echo "aws ecr delete-repository --region ${AWS_REGION} --repository-name frontend --force || true"

echo
echo "Rebuild flow later:"
echo "cd ${TERRAFORM_DIR}"
echo "terraform apply"
echo "cd ${PROJECT_ROOT}"
echo "./scripts/bootstrap-platform.sh"
echo "Then run Jenkins Build Now"
echo "./scripts/verify-platform.sh"
