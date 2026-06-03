pipeline {
    agent any

    environment {
        AWS_REGION     = 'us-west-1'
        AWS_ACCOUNT_ID = '897421226830'
        ECR_REGISTRY   = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        USER_IMAGE         = "${ECR_REGISTRY}/user-service"
        ORDER_IMAGE        = "${ECR_REGISTRY}/order-service"
        NOTIFICATION_IMAGE = "${ECR_REGISTRY}/notification-service"
        FRONTEND_IMAGE     = "${ECR_REGISTRY}/frontend"

        GITOPS_FILE = 'k8s/overlays/prod/kustomization.yaml'
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
                    git --version
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
                retry(3) {
                    sh '''
                        docker push $USER_IMAGE:${BUILD_NUMBER}
                        docker push $ORDER_IMAGE:${BUILD_NUMBER}
                        docker push $NOTIFICATION_IMAGE:${BUILD_NUMBER}
                        docker push $FRONTEND_IMAGE:${BUILD_NUMBER}
                    '''
                }
            }
        }

        stage('Update GitOps Manifests') {
            steps {
                sh '''
                    git config user.email "jenkins@shopease.local"
                    git config user.name "Jenkins GitOps"

                    sed -i '/newName: 897421226830.dkr.ecr.us-west-1.amazonaws.com\\/user-service/{n;s/newTag:.*/newTag: "'$BUILD_NUMBER'"/}' $GITOPS_FILE
                    sed -i '/newName: 897421226830.dkr.ecr.us-west-1.amazonaws.com\\/order-service/{n;s/newTag:.*/newTag: "'$BUILD_NUMBER'"/}' $GITOPS_FILE
                    sed -i '/newName: 897421226830.dkr.ecr.us-west-1.amazonaws.com\\/notification-service/{n;s/newTag:.*/newTag: "'$BUILD_NUMBER'"/}' $GITOPS_FILE
                    sed -i '/newName: 897421226830.dkr.ecr.us-west-1.amazonaws.com\\/frontend/{n;s/newTag:.*/newTag: "'$BUILD_NUMBER'"/}' $GITOPS_FILE

                    echo "Updated GitOps manifest:"
                    grep -A2 "newName:" $GITOPS_FILE

                    git add $GITOPS_FILE
                    git commit -m "Update prod image tags to build ${BUILD_NUMBER}" || echo "No changes to commit"
                '''
            }
        }

        stage('Push GitOps Update') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github-gitops-token',
                    usernameVariable: 'GIT_USERNAME',
                    passwordVariable: 'GIT_TOKEN'
                )]) {
                    sh '''
                        git remote set-url origin https://${GIT_USERNAME}:${GIT_TOKEN}@github.com/mariammansour956-stack/final_garde.git
                        git push origin HEAD:main
                    '''
                }
            }
        }

        stage('Wait for Argo CD Sync') {
            steps {
                sh '''
                    echo "Jenkins finished CI and pushed GitOps update."
                    echo "Argo CD will detect the Git change and sync automatically."

                    sleep 30

                    kubectl get application shopease-prod -n argocd
                    kubectl get pods -n prod
                    kubectl get ingress -n prod
                '''
            }
        }
    }

    post {
        success {
            echo 'CI completed. GitOps update pushed. Argo CD handles deployment.'
        }
        failure {
            echo 'Pipeline failed. Check console output.'
        }
    }
}