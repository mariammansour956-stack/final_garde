# ShopEase Cloud-Native E-Commerce Platform

ShopEase is a cloud-native e-commerce platform built with FastAPI microservices and a React frontend, deployed on AWS using a full DevOps workflow.

The project demonstrates a complete production-style pipeline:

* Microservices architecture
* Docker image builds
* Jenkins CI/CD
* Amazon ECR
* Amazon EKS
* Argo CD GitOps deployment
* AWS Load Balancer Controller
* Karpenter dynamic node provisioning
* Prometheus and Grafana monitoring
* Application-level metrics
* Security scanning with Trivy
* Code quality with SonarQube
* Safe stop, destroy, and rebuild automation

---

## 1. Project Overview

ShopEase is an e-commerce application composed of:

| Component            | Technology           | Port | Description                            |
| -------------------- | -------------------- | ---: | -------------------------------------- |
| frontend             | React + Vite + Nginx |   80 | Web UI                                 |
| user-service         | FastAPI + SQLite     | 8001 | Authentication, users, JWT             |
| order-service        | FastAPI + SQLite     | 8002 | Orders, status workflow, order metrics |
| notification-service | FastAPI + SQLite     | 8003 | Notifications and read/unread tracking |

Each backend service exposes:

```text
/health
/ready
/metrics
```

The `/metrics` endpoint is used by Prometheus to collect real application metrics.

---

## 2. Final Cloud Architecture

```text
Developer
  |
  v
GitHub Repository
  |
  v
Jenkins CI/CD Pipeline
  |-- Checkout
  |-- Static validation
  |-- SonarQube analysis
  |-- Docker build
  |-- Trivy image scan
  |-- Push images to Amazon ECR
  |-- Update Kubernetes image tags
  v
GitOps Manifests
  |
  v
Argo CD
  |
  v
Amazon EKS
  |-- frontend
  |-- user-service
  |-- order-service
  |-- notification-service
  |
  v
AWS Load Balancer Controller
  |
  v
Application Load Balancer
  |
  v
Users
```

Monitoring layer:

```text
Prometheus
  |-- Kubernetes metrics
  |-- Node metrics
  |-- Application /metrics
  |-- Blackbox HTTP probes
  |
  v
Grafana Dashboard
```

Autoscaling layer:

```text
Karpenter
  |-- Watches pending pods
  |-- Provisions EC2 nodes dynamically
  |-- Uses NodePool and EC2NodeClass
```

---

## 3. Repository Structure

```text
prod-grad-project/
├── ecommerce-frontend/
├── ecommerce-microservices/
│   ├── user-service/
│   ├── order-service/
│   └── notification-service/
├── k8s/
│   ├── overlays/
│   │   └── prod/
│   ├── monitoring/
│   │   ├── shopease-app-probes.yaml
│   │   ├── shopease-app-servicemonitors.yaml
│   │   └── shopease-application-dashboard.yaml
│   └── karpenter/
│       └── scale-test.yaml
├── terraform/
├── scripts/
│   ├── bootstrap-platform.sh
│   ├── verify-platform.sh
│   └── stop-costly-resources.sh
├── Jenkinsfile
└── README.md
```

---

## 4. Local Docker Compose Mode

The original application can still run locally using Docker Compose.

```bash
cd ecommerce-microservices
docker compose up --build -d
```

Check containers:

```bash
docker ps
```

Test services:

```bash
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
curl http://localhost:80
```

Stop local environment:

```bash
docker compose down
```

---

## 5. AWS Infrastructure with Terraform

Terraform creates the AWS infrastructure required for the platform.

Main AWS resources:

* VPC
* Public and private subnets
* NAT Gateway
* EKS cluster
* EKS managed nodes
* IAM roles and policies
* OIDC provider
* ECR repositories
* Security groups

Create infrastructure:

```bash
cd terraform
terraform apply
```

Destroy infrastructure:

```bash
cd terraform
terraform destroy
```

---

## 6. Platform Bootstrap

After Terraform creates the infrastructure, run:

```bash
cd ~/Desktop/grade-project2/prod-grad-project
./scripts/bootstrap-platform.sh
```

The script installs and configures:

* kubeconfig
* ECR repositories
* metrics-server
* AWS Load Balancer Controller
* Argo CD
* Karpenter
* Prometheus
* Grafana
* Blackbox Exporter
* Jenkins kubeconfig access

The script also includes fixes for:

* AWS Load Balancer Controller CRDs
* Monitoring CRDs
* Current EKS OIDC trust policy
* Karpenter IAM trust policy
* Argo CD server-side apply conflict handling

---

## 7. Jenkins CI/CD Pipeline

Jenkins is responsible for building, scanning, pushing, and deploying the application.

Pipeline stages:

```text
Checkout
Frontend static validation
Backend validation
SonarQube analysis
Login to ECR
Build Docker images
Verify order-service metrics code
Trivy image scan
Tag images
Push images to ECR
Update GitOps manifests
Push GitOps update
Wait for Argo CD sync
```

Images built:

```text
user-service
order-service
notification-service
frontend
```

The pipeline pushes images to Amazon ECR and updates:

```text
k8s/overlays/prod/kustomization.yaml
```

Then Argo CD deploys the new version automatically.

Important improvement added:

```text
Docker builds use --no-cache
Jenkins verifies that order-service image contains orders_created_total
```

This prevents old cached images from being deployed.

---

## 8. Security and Quality

### SonarQube

Used for static code analysis and code quality checks.

### Trivy

Used for image vulnerability scanning.

Example:

```bash
trivy image --severity HIGH,CRITICAL order-service:<tag>
```

The pipeline scans all service images before pushing them.

---

## 9. GitOps with Argo CD

Argo CD continuously watches Git and syncs Kubernetes manifests to EKS.

Check Argo CD apps:

```bash
kubectl get applications -n argocd
```

Expected final state:

```text
karpenter-config   Synced   Healthy
shopease-prod      Synced   Healthy
```

Force refresh if needed:

```bash
kubectl annotate application shopease-prod -n argocd \
  argocd.argoproj.io/refresh=hard --overwrite
```

---

## 10. Kubernetes Production Deployment

Production namespace:

```text
prod
```

Check production pods:

```bash
kubectl get pods -n prod
```

Expected services:

```text
frontend
user-service
order-service
notification-service
```

Check services:

```bash
kubectl get svc -n prod
```

Check ingress:

```bash
kubectl get ingress -n prod
```

Get the application link:

```bash
kubectl get ingress shopease-alb-ingress -n prod \
  -o jsonpath='http://{.status.loadBalancer.ingress[0].hostname}'; echo
```

---

## 11. AWS Load Balancer Controller

The application is exposed through AWS Load Balancer Controller.

Ingress routes:

| Path             | Backend              |
| ---------------- | -------------------- |
| `/`              | frontend             |
| `/auth`          | user-service         |
| `/users`         | user-service         |
| `/orders`        | order-service        |
| `/notifications` | notification-service |

Check controller:

```bash
kubectl get pods -n kube-system | grep aws-load-balancer
```

Check ingress:

```bash
kubectl describe ingress shopease-alb-ingress -n prod
```

---

## 12. Monitoring Stack

Monitoring stack:

* Prometheus
* Grafana
* Alertmanager
* kube-state-metrics
* node-exporter
* Blackbox Exporter
* ServiceMonitor
* Probe

Open Grafana:

```bash
kubectl port-forward -n monitoring svc/monitoring-grafana 3010:80
```

URL:

```text
http://127.0.0.1:3010
```

Login:

```text
admin / admin123
```

Open Prometheus:

```bash
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9091:9090
```

URL:

```text
http://localhost:9091
```

---

## 13. Application Monitoring

A custom Grafana dashboard was created:

```text
ShopEase Application
```

Dashboard panels:

| Panel                        | Description                               |
| ---------------------------- | ----------------------------------------- |
| Application Availability     | HTTP availability using Blackbox Exporter |
| Synthetic Response Time      | External HTTP probe response time         |
| Synthetic Error Rate         | Probe failure rate                        |
| Real Request Rate            | Real request rate from FastAPI metrics    |
| Real Error Rate              | Real error rate from application metrics  |
| Real Response Time P95       | 95th percentile response time             |
| Orders Created - Total       | Total created orders                      |
| EC2 Cloud Nodes CPU Usage    | EKS node CPU                              |
| EC2 Cloud Nodes Memory Usage | EKS node memory                           |

---

## 14. Blackbox Exporter

Blackbox Exporter checks service availability through HTTP probes.

Targets:

```text
frontend
user-service
order-service
notification-service
ALB public URL
```

Check probe success:

```bash
curl -G "http://localhost:9091/api/v1/query" \
  --data-urlencode 'query=probe_success'
```

Expected value:

```text
1
```

This means the target is reachable.

---

## 15. Real Application Metrics

FastAPI services expose Prometheus metrics through:

```text
/metrics
```

ServiceMonitors were added for:

```text
user-service
order-service
notification-service
```

Check request rate:

```bash
curl -G "http://localhost:9091/api/v1/query" \
  --data-urlencode 'query=sum(rate(http_requests_total{namespace="prod",handler!="/metrics"}[5m])) by (service)'
```

Check response time P95:

```bash
curl -G "http://localhost:9091/api/v1/query" \
  --data-urlencode 'query=histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{namespace="prod",handler!="/metrics"}[5m])) by (le, service))'
```

---

## 16. Orders Created Metric

A custom metric was added to `order-service`:

```text
orders_created_total
```

It counts successful order creation events.

The metric is initialized with zero so it appears before the first order:

```python
orders_created_total.labels(service="order-service").inc(0)
```

When an order is created:

```python
orders_created_total.labels(service="order-service").inc()
```

Check metric:

```bash
curl -G "http://localhost:9091/api/v1/query" \
  --data-urlencode 'query=orders_created_total'
```

Expected result after creating orders:

```text
orders_created_total = 1, 2, 3, ...
```

---

## 17. Karpenter Autoscaling

Karpenter is a key part of this project.

It dynamically provisions EC2 worker nodes for EKS based on pending pods.

Instead of keeping extra nodes running all the time, Karpenter watches Kubernetes scheduling needs and creates suitable EC2 capacity only when needed.

Benefits:

* Dynamic node provisioning
* Faster scaling
* Better resource utilization
* Lower cost
* Cloud-native autoscaling

Check Karpenter:

```bash
kubectl get pods -n kube-system | grep karpenter
```

Check resources:

```bash
kubectl get nodepool
kubectl get ec2nodeclass
```

Expected:

```text
shopease-general   Ready=True
shopease-default   Ready=True
```

---

## 18. Karpenter Demo

Scale test file:

```text
k8s/karpenter/scale-test.yaml
```

The test creates:

```text
6 replicas
500m CPU per pod
512Mi memory per pod
nodeSelector: workload-type=karpenter
```

Apply the demo:

```bash
kubectl apply -f k8s/karpenter/scale-test.yaml
```

Watch pods:

```bash
kubectl get pods -n prod -w
```

Watch nodes:

```bash
kubectl get nodes -w
```

Watch Karpenter logs:

```bash
kubectl logs -n kube-system deployment/karpenter --tail=100
```

Delete the demo workload:

```bash
kubectl delete -f k8s/karpenter/scale-test.yaml
```

Demo explanation:

```text
When the scale-test workload cannot be scheduled on existing nodes,
Karpenter detects the pending pods and provisions additional EC2 capacity.
After the workload is removed, unused capacity can be consolidated to reduce cost.
```

---

## 19. Final Verification

Run:

```bash
./scripts/verify-platform.sh
```

The script checks:

* Kubernetes context
* EKS nodes
* Argo CD applications
* Production pods
* Production services
* Ingress and ALB
* Platform controllers
* Karpenter resources
* Monitoring pods
* Monitoring services
* ALB HTTP response
* Prometheus service
* Grafana service

Expected final state:

```text
EKS Nodes Ready
Argo CD Synced / Healthy
Production Pods Running
ALB returns 200 OK
AWS Load Balancer Controller Running
Karpenter Running
Prometheus Running
Grafana Running
Blackbox Exporter Running
```

---

## 20. Stop Costly Resources

To safely stop cloud resources before destroy:

```bash
./scripts/stop-costly-resources.sh
```

The script:

* Deletes Argo CD applications
* Deletes production ingress
* Waits for ALB deletion
* Waits for ELB ENIs to disappear
* Stops Jenkins locally
* Prepares for Terraform destroy

Then run:

```bash
cd terraform
terraform destroy
```

---

## 21. Destroy Verification

After destroy:

```bash
aws eks list-clusters --region us-west-1
```

Expected:

```text
clusters: []
```

Check load balancers:

```bash
aws elbv2 describe-load-balancers --region us-west-1 --output table
```

Check EC2:

```bash
aws ec2 describe-instances \
  --region us-west-1 \
  --query "Reservations[*].Instances[*].[InstanceId,State.Name,InstanceType,Tags[?Key=='Name'].Value|[0]]" \
  --output table
```

Check NAT Gateway:

```bash
aws ec2 describe-nat-gateways \
  --region us-west-1 \
  --query "NatGateways[*].[NatGatewayId,State,VpcId]" \
  --output table
```

---

## 22. Rebuild Workflow

To rebuild later:

```bash
cd terraform
terraform apply
```

Then:

```bash
cd ..
./scripts/bootstrap-platform.sh
```

Then run Jenkins:

```text
Jenkins → shopease-ci-cd → Build Now
```

Finally:

```bash
./scripts/verify-platform.sh
```

---

## 23. Troubleshooting Notes

### ALB Controller CRD issue

If Helm fails with:

```text
no matches for kind IngressClassParams
```

Apply CRDs first:

```bash
helm show crds eks/aws-load-balancer-controller | kubectl apply -f -
kubectl wait --for=condition=Established crd/ingressclassparams.elbv2.k8s.aws --timeout=120s
kubectl api-resources | grep -i ingressclassparams
```

Then install Helm with:

```bash
--skip-crds
```

### Monitoring CRD issue

If Prometheus install fails with missing CRDs:

```bash
helm show crds prometheus-community/kube-prometheus-stack | kubectl apply --server-side -f -
kubectl wait --for=condition=Established crd/prometheuses.monitoring.coreos.com --timeout=120s
```

### Grafana port-forward issue

If browser says connection refused:

```bash
pkill -f "kubectl port-forward" || true
kubectl port-forward -n monitoring svc/monitoring-grafana 3010:80
```

Open:

```text
http://127.0.0.1:3010
```

### Image cache issue

If Kubernetes runs an image without latest code:

```text
Use docker build --no-cache
Verify code inside image before push
```

The Jenkinsfile now verifies:

```text
orders_created_total
```

inside `order-service` image.

---

## 24. Demo Checklist

Before presenting, prepare screenshots or live tabs for:

```text
1. GitHub repository
2. Jenkins successful build
3. Argo CD Synced / Healthy
4. EKS nodes
5. Production pods
6. Ingress and ALB URL
7. Application UI
8. Prometheus targets
9. Grafana ShopEase Application dashboard
10. Orders Created metric
11. Karpenter NodePool and EC2NodeClass
12. Karpenter scale-test demo
13. verify-platform.sh output
14. stop-costly-resources.sh script
```

Useful commands:

```bash
kubectl get nodes
kubectl get pods -n prod
kubectl get svc -n prod
kubectl get ingress -n prod
kubectl get applications -n argocd
kubectl get nodepool
kubectl get ec2nodeclass
kubectl get pods -n monitoring
./scripts/verify-platform.sh
```

---

## 25. Final Summary

ShopEase started as a Dockerized microservices e-commerce application and was extended into a complete cloud-native DevOps platform.

The final project includes:

* AWS infrastructure with Terraform
* Kubernetes deployment on EKS
* Jenkins CI/CD pipeline
* ECR image registry
* GitOps deployment with Argo CD
* ALB public access
* Karpenter node autoscaling
* Prometheus and Grafana monitoring
* Application-level metrics
* Orders created business metric
* Safe stop and rebuild automation

This project demonstrates the full lifecycle of a modern DevOps system from code to cloud deployment, monitoring, scaling, troubleshooting, and cost-safe shutdown.
