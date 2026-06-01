pipeline {
    agent any

    environment {
        AWS_REGION     = 'us-west-1'
        AWS_ACCOUNT_ID = '897421226830'
        ECR_REGISTRY   = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        USER_IMAGE          = "${ECR_REGISTRY}/user-service"
        ORDER_IMAGE         = "${ECR_REGISTRY}/order-service"
        NOTIFICATION_IMAGE  = "${ECR_REGISTRY}/notification-service"
        FRONTEND_IMAGE      = "${ECR_REGISTRY}/frontend"

        K8S_NAMESPACE = 'prod'
        ALB_DNS = 'shopease-dev-alb-661958777.us-west-1.elb.amazonaws.com'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verify Tools') {
            steps {
                sh '''
                    docker --version
                    aws --version
                    kubectl version --client
                    kubectl get nodes
                '''
            }
        }

        stage('Login to ECR') {
            steps {
                sh '''
                    aws ecr get-login-password --region $AWS_REGION | \
                    docker login --username AWS --password-stdin $ECR_REGISTRY
                '''
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    docker build -t user-service:${BUILD_NUMBER} ecommerce-microservices/user-service
                    docker build -t order-service:${BUILD_NUMBER} ecommerce-microservices/order-service
                    docker build -t notification-service:${BUILD_NUMBER} ecommerce-microservices/notification-service

                    docker build \
                      -f ecommerce-frontend/Dockerfile.alb \
                      -t frontend:${BUILD_NUMBER} \
                      --build-arg VITE_USER_SERVICE_URL=http://$ALB_DNS \
                      --build-arg VITE_ORDER_SERVICE_URL=http://$ALB_DNS \
                      --build-arg VITE_NOTIFICATION_SERVICE_URL=http://$ALB_DNS \
                      ecommerce-frontend
                '''
            }
        }

        stage('Tag Images') {
            steps {
                sh '''
                    docker tag user-service:${BUILD_NUMBER} $USER_IMAGE:${BUILD_NUMBER}
                    docker tag order-service:${BUILD_NUMBER} $ORDER_IMAGE:${BUILD_NUMBER}
                    docker tag notification-service:${BUILD_NUMBER} $NOTIFICATION_IMAGE:${BUILD_NUMBER}
                    docker tag frontend:${BUILD_NUMBER} $FRONTEND_IMAGE:${BUILD_NUMBER}
                '''
            }
        }

        stage('Push Images to ECR') {
            steps {
                sh '''
                    docker push $USER_IMAGE:${BUILD_NUMBER}
                    docker push $ORDER_IMAGE:${BUILD_NUMBER}
                    docker push $NOTIFICATION_IMAGE:${BUILD_NUMBER}
                    docker push $FRONTEND_IMAGE:${BUILD_NUMBER}
                '''
            }
        }

        stage('Deploy to EKS') {
            steps {
                sh '''
                    kubectl set image deployment/user-service \
                      user-service=$USER_IMAGE:${BUILD_NUMBER} \
                      -n $K8S_NAMESPACE

                    kubectl set image deployment/order-service \
                      order-service=$ORDER_IMAGE:${BUILD_NUMBER} \
                      -n $K8S_NAMESPACE

                    kubectl set image deployment/notification-service \
                      notification-service=$NOTIFICATION_IMAGE:${BUILD_NUMBER} \
                      -n $K8S_NAMESPACE

                    kubectl set image deployment/frontend \
                      frontend=$FRONTEND_IMAGE:${BUILD_NUMBER} \
                      -n $K8S_NAMESPACE
                '''
            }
        }

        stage('Verify Rollout') {
            steps {
                sh '''
                    kubectl rollout status deployment/user-service -n $K8S_NAMESPACE
                    kubectl rollout status deployment/order-service -n $K8S_NAMESPACE
                    kubectl rollout status deployment/notification-service -n $K8S_NAMESPACE
                    kubectl rollout status deployment/frontend -n $K8S_NAMESPACE

                    kubectl get pods -n $K8S_NAMESPACE
                    kubectl get ingress -n $K8S_NAMESPACE
                '''
            }
        }
    }

    post {
        success {
            echo 'CI/CD pipeline completed successfully.'
        }
        failure {
            echo 'CI/CD pipeline failed. Check logs.'
        }
    }
}
