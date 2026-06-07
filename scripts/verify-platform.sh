#!/usr/bin/env bash
set -euo pipefail

echo "=================================================="
echo " Verify ShopEase Platform"
echo "=================================================="

echo
echo "==> Current Kubernetes context"
kubectl config current-context

echo
echo "==> Nodes"
kubectl get nodes -o wide

echo
echo "==> Argo CD Applications"
kubectl get applications -n argocd

echo
echo "==> Production Pods"
kubectl get pods -n prod

echo
echo "==> Production Services"
kubectl get svc -n prod

echo
echo "==> Production Ingress"
kubectl get ingress -n prod

echo
echo "==> Platform Controllers"
kubectl get pods -n kube-system | grep -E "aws-load-balancer|karpenter|metrics" || true

echo
echo "==> Karpenter Resources"
kubectl get ec2nodeclass || true
kubectl get nodepool || true

echo
echo "==> Monitoring Pods"
kubectl get pods -n monitoring || true

echo
echo "==> Monitoring Services"
kubectl get svc -n monitoring || true

echo
echo "==> ALB DNS"
ALB_DNS="$(kubectl get ingress shopease-alb-ingress -n prod -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || true)"

if [ -n "$ALB_DNS" ]; then
  echo "ALB: http://${ALB_DNS}"
  echo
  echo "==> Testing ALB HTTP response"
  curl -I "http://${ALB_DNS}" || true
else
  echo "ALB DNS not ready yet."
fi

echo
echo "==> Prometheus quick API check"
if kubectl get svc -n monitoring monitoring-kube-prometheus-prometheus >/dev/null 2>&1; then
  echo "Prometheus service exists."
else
  echo "Prometheus service not found."
fi

echo
echo "==> Grafana quick check"
if kubectl get svc -n monitoring monitoring-grafana >/dev/null 2>&1; then
  echo "Grafana service exists."
else
  echo "Grafana service not found."
fi

echo
echo "=================================================="
echo " Verification completed"
echo "=================================================="

echo
echo "Access commands:"
echo "Grafana:"
echo "kubectl port-forward -n monitoring svc/monitoring-grafana 3001:80"
echo "URL: http://localhost:3001"
echo "Login: admin / admin123"

echo
echo "Prometheus:"
echo "kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9091:9090"
echo "URL: http://localhost:9091"
