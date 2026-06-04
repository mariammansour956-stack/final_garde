#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="us-west-1"
CLUSTER_NAME="shopease-dev-eks"

echo "=================================================="
echo " Verify ShopEase Platform"
echo "=================================================="

echo "==> AWS identity"
aws sts get-caller-identity

echo "==> Current kubectl context"
kubectl config current-context

echo "==> EKS nodes"
kubectl get nodes -o wide

echo "==> System pods"
kubectl get pods -n kube-system

echo "==> Metrics"
kubectl top nodes || true

echo "==> Argo CD applications"
kubectl get applications -n argocd

echo "==> Argo CD pods"
kubectl get pods -n argocd

echo "==> Production workloads"
kubectl get pods -n prod
kubectl get svc -n prod
kubectl get ingress -n prod
kubectl get hpa -n prod

echo "==> Karpenter"
kubectl get pods -n kube-system | grep karpenter || true
kubectl get ec2nodeclass || true
kubectl get nodepool || true
kubectl get nodeclaim || true

echo "==> ECR repositories"
aws ecr describe-repositories \
  --region "$AWS_REGION" \
  --query "repositories[*].repositoryName"

echo "==> Jenkins"
systemctl status jenkins --no-pager || true
sudo -u jenkins kubectl get nodes || true
sudo -u jenkins aws sts get-caller-identity || true
sudo -u jenkins docker ps || true

echo "=================================================="
echo " Verification completed."
echo "=================================================="
