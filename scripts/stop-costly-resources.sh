#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="us-west-1"
CLUSTER_NAME="shopease-dev-eks"

echo "=================================================="
echo " Stop costly resources"
echo "=================================================="

echo "This script deletes cloud resources to reduce AWS cost."
echo "Use it only when you are done for the day."
echo ""
read -p "Type yes to continue: " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
  echo "Cancelled."
  exit 0
fi

echo "==> Delete Argo CD apps to stop self-healing resources..."
kubectl delete application shopease-prod -n argocd --ignore-not-found || true
kubectl delete application karpenter-config -n argocd --ignore-not-found || true

echo "==> Delete ALB ingress..."
kubectl delete ingress shopease-alb-ingress -n prod --ignore-not-found || true

echo "==> Stop Jenkins locally..."
sudo systemctl stop jenkins || true

echo "==> Reminder:"
echo "To remove all AWS cost, run:"
echo "cd terraform && terraform destroy"
echo ""
echo "After destroy, delete ECR repos if needed:"
echo "aws ecr delete-repository --region us-west-1 --repository-name user-service --force"
echo "aws ecr delete-repository --region us-west-1 --repository-name order-service --force"
echo "aws ecr delete-repository --region us-west-1 --repository-name notification-service --force"
echo "aws ecr delete-repository --region us-west-1 --repository-name frontend --force"

echo "=================================================="
echo " Done."
echo "=================================================="
