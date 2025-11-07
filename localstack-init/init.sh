#!/bin/bash

echo "Initializing LocalStack S3 bucket..."

awslocal s3 mb s3://scraper-exports
awslocal s3api put-bucket-acl --bucket scraper-exports --acl public-read

echo "S3 bucket 'scraper-exports' created successfully"
