#!/bin/bash

# Deployment script for frontend to S3
# Usage: ./deploy-frontend.sh <bucket-name> [region]

BUCKET_NAME=$1
REGION=${2:-us-east-1}

if [ -z "$BUCKET_NAME" ]; then
    echo "Usage: ./deploy-frontend.sh <bucket-name> [region]"
    echo "Example: ./deploy-frontend.sh my-point-cloud-app us-east-1"
    exit 1
fi

echo "Deploying frontend to S3 bucket: $BUCKET_NAME in region: $REGION"

# Check if bucket exists, create if not
if ! aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "Bucket already exists"
else
    echo "Creating bucket..."
    aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
fi

# Enable static website hosting
echo "Enabling static website hosting..."
aws s3 website "s3://$BUCKET_NAME" \
    --index-document index.html \
    --error-document index.html

# Set bucket policy for public read access
echo "Setting bucket policy..."
aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
        \"Sid\": \"PublicReadGetObject\",
        \"Effect\": \"Allow\",
        \"Principal\": \"*\",
        \"Action\": \"s3:GetObject\",
        \"Resource\": \"arn:aws:s3:::$BUCKET_NAME/*\"
    }]
}"

# Sync files
echo "Syncing files to S3..."
aws s3 sync frontend/ "s3://$BUCKET_NAME" --delete

echo ""
echo "Deployment complete!"
echo "Website URL: http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo ""
echo "Note: Update frontend/js/api.js with your API Gateway URL before accessing the site."
