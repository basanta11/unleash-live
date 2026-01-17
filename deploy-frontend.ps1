# PowerShell deployment script for frontend to S3
# Usage: .\deploy-frontend.ps1 -BucketName <bucket-name> [-Region <region>]

param(
    [Parameter(Mandatory=$true)]
    [string]$BucketName,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "ap-southeast-2"
)

Write-Host "Deploying frontend to S3 bucket: $BucketName in region: $Region" -ForegroundColor Green

# Check if bucket exists
$bucketExists = aws s3 ls "s3://$BucketName" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating bucket..." -ForegroundColor Yellow
    aws s3 mb "s3://$BucketName" --region $Region
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to create bucket" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Bucket already exists" -ForegroundColor Green
}

# Enable static website hosting
Write-Host "Enabling static website hosting..." -ForegroundColor Yellow
aws s3 website "s3://$BucketName" --index-document index.html --error-document index.html

# Disable Block Public Access settings
Write-Host "Configuring public access settings..." -ForegroundColor Yellow
aws s3api put-public-access-block --bucket $BucketName --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Set bucket policy
Write-Host "Setting bucket policy..." -ForegroundColor Yellow
$policyJson = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BucketName/*"
        }
    ]
}
"@

$policyFile = "$env:TEMP\bucket-policy-$BucketName.json"
$policyJson | Out-File -FilePath $policyFile -Encoding utf8 -NoNewline
aws s3api put-bucket-policy --bucket $BucketName --policy "file://$policyFile"
Remove-Item $policyFile -ErrorAction SilentlyContinue

# Sync files
Write-Host "Syncing files to S3..." -ForegroundColor Yellow
aws s3 sync frontend/ "s3://$BucketName" --delete

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Website URL: http://$BucketName.s3-website-$Region.amazonaws.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Update frontend/js/api.js with your API Gateway URL before accessing the site." -ForegroundColor Yellow
