#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="us-west-1"
CLUSTER_NAME="shopease-dev-eks"
AWS_ACCOUNT_ID="897421226830"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TERRAFORM_DIR="${PROJECT_ROOT}/terraform"

cd "$PROJECT_ROOT"

echo "==> Update kubeconfig"
aws eks update-kubeconfig --region "$AWS_REGION" --name "$CLUSTER_NAME"

echo "==> Check nodes"
kubectl get nodes

echo "==> Ensure ECR repositories"
for repo in user-service order-service notification-service frontend; do
  aws ecr describe-repositories --region "$AWS_REGION" --repository-names "$repo" >/dev/null 2>&1 || \
  aws ecr create-repository --region "$AWS_REGION" --repository-name "$repo"
done

echo "==> Install metrics-server"
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

echo "==> Associate OIDC provider"
eksctl utils associate-iam-oidc-provider \
  --cluster "$CLUSTER_NAME" \
  --region "$AWS_REGION" \
  --approve || true

echo "==> Ensure AWS Load Balancer Controller IAM policy"
aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document "file://${PROJECT_ROOT}/iam_policy.json" >/dev/null 2>&1 || true

echo "==> Create / update AWS Load Balancer Controller service account"
eksctl create iamserviceaccount \
  --cluster="$CLUSTER_NAME" \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn="arn:aws:iam::${AWS_ACCOUNT_ID}:policy/AWSLoadBalancerControllerIAMPolicy" \
  --approve \
  --region="$AWS_REGION" \
  --override-existing-serviceaccounts || true

echo "==> Install AWS Load Balancer Controller"
helm repo add eks https://aws.github.io/eks-charts >/dev/null 2>&1 || true
helm repo update

VPC_ID="$(terraform -chdir="$TERRAFORM_DIR" output -raw vpc_id)"

helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName="$CLUSTER_NAME" \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region="$AWS_REGION" \
  --set vpcId="$VPC_ID"

echo "==> Install Argo CD"
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "==> Wait for Argo CD pods"
kubectl wait --for=condition=Ready pod \
  -l app.kubernetes.io/part-of=argocd \
  -n argocd \
  --timeout=10m || true

echo "==> Scale down ApplicationSet controller if unstable"
kubectl scale deployment argocd-applicationset-controller -n argocd --replicas=0 || true

echo "==> Apply Argo CD Applications"
kubectl apply -f argocd/shopease-prod-application.yaml
kubectl apply -f argocd/karpenter-config-application.yaml

echo "==> Install Karpenter"
KARPENTER_VERSION="1.12.1"
KARPENTER_NAMESPACE="kube-system"

curl -fsSL "https://raw.githubusercontent.com/aws/karpenter-provider-aws/v${KARPENTER_VERSION}/website/content/en/preview/getting-started/getting-started-with-karpenter/cloudformation.yaml" \
  -o /tmp/karpenter-cloudformation.yaml

aws cloudformation deploy \
  --region "$AWS_REGION" \
  --stack-name "Karpenter-${CLUSTER_NAME}" \
  --template-file /tmp/karpenter-cloudformation.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides "ClusterName=${CLUSTER_NAME}" || true

eksctl create iamserviceaccount \
  --cluster "$CLUSTER_NAME" \
  --region "$AWS_REGION" \
  --namespace "$KARPENTER_NAMESPACE" \
  --name karpenter \
  --role-name "${CLUSTER_NAME}-karpenter" \
  --attach-policy-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:policy/KarpenterControllerNodeLifecyclePolicy-${CLUSTER_NAME}" \
  --attach-policy-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:policy/KarpenterControllerIAMIntegrationPolicy-${CLUSTER_NAME}" \
  --attach-policy-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:policy/KarpenterControllerEKSIntegrationPolicy-${CLUSTER_NAME}" \
  --attach-policy-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:policy/KarpenterControllerInterruptionPolicy-${CLUSTER_NAME}" \
  --attach-policy-arn "arn:aws:iam::${AWS_ACCOUNT_ID}:policy/KarpenterControllerResourceDiscoveryPolicy-${CLUSTER_NAME}" \
  --approve \
  --role-only || true

eksctl create iamidentitymapping \
  --cluster "$CLUSTER_NAME" \
  --region "$AWS_REGION" \
  --arn "arn:aws:iam::${AWS_ACCOUNT_ID}:role/KarpenterNodeRole-${CLUSTER_NAME}" \
  --username "system:node:{{EC2PrivateDNSName}}" \
  --group system:bootstrappers \
  --group system:nodes || true

PRIVATE_SUBNET_IDS="$(terraform -chdir="$TERRAFORM_DIR" output -json private_subnet_ids | python3 -c "import sys,json; print(' '.join(json.load(sys.stdin)))")"

aws ec2 create-tags \
  --region "$AWS_REGION" \
  --resources $PRIVATE_SUBNET_IDS \
  --tags Key=karpenter.sh/discovery,Value="$CLUSTER_NAME"

CLUSTER_SG="$(aws eks describe-cluster \
  --region "$AWS_REGION" \
  --name "$CLUSTER_NAME" \
  --query "cluster.resourcesVpcConfig.clusterSecurityGroupId" \
  --output text)"

aws ec2 create-tags \
  --region "$AWS_REGION" \
  --resources "$CLUSTER_SG" \
  --tags Key=karpenter.sh/discovery,Value="$CLUSTER_NAME"

KARPENTER_IAM_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${CLUSTER_NAME}-karpenter"

helm registry logout public.ecr.aws >/dev/null 2>&1 || true

helm upgrade --install karpenter oci://public.ecr.aws/karpenter/karpenter \
  --version "$KARPENTER_VERSION" \
  --namespace "$KARPENTER_NAMESPACE" \
  --create-namespace \
  --set "settings.clusterName=${CLUSTER_NAME}" \
  --set "settings.interruptionQueue=${CLUSTER_NAME}" \
  --set "serviceAccount.annotations.eks\.amazonaws\.com/role-arn=${KARPENTER_IAM_ROLE_ARN}" \
  --wait

echo "==> Update Jenkins kubeconfig"
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube

echo "==> Start Jenkins"
sudo systemctl start jenkins || true

echo "==> Bootstrap completed"
kubectl get applications -n argocd || true
kubectl get pods -n kube-system | grep -E "aws-load-balancer|karpenter|metrics" || true
