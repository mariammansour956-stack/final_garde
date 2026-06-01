terraform {
  backend "s3" {
    bucket         = "shopease-tf-state-897421226830-us-west-1"
    key            = "dev/terraform.tfstate"
    region         = "us-west-1"
    dynamodb_table = "shopease-tf-locks"
    encrypt        = true
  }
}
