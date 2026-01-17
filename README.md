# Point Cloud Annotator

A full-stack serverless web application for loading, viewing, and annotating 3D point clouds. Built with vanilla JavaScript frontend, AWS Lambda, API Gateway, and DynamoDB.

## Architecture

This application implements **Tier 3** of the requirements:

- **Frontend**: Vanilla JavaScript with Potree viewer, deployed as static site on AWS S3
- **Backend**: Serverless API using AWS API Gateway, Lambda functions, and DynamoDB
- **Infrastructure**: Infrastructure as Code using Serverless Framework

### Architecture Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ HTTPS
       │
┌──────▼─────────────────────────────────────┐
│         AWS CloudFront (CDN)                │
└──────┬──────────────────────────────────────┘
       │
       │
┌──────▼──────┐         ┌──────────────────┐
│  S3 Bucket  │         │   API Gateway     │
│  (Frontend) │         └─────────┬─────────┘
└─────────────┘                   │
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
            ┌───────▼──┐  ┌───────▼──┐  ┌───────▼──┐
            │  Lambda  │  │  Lambda  │  │  Lambda  │
            │   GET    │  │   POST   │  │  DELETE  │
            └─────┬────┘  └─────┬────┘  └─────┬────┘
                  │             │             │
                  └─────────────┼─────────────┘
                                │
                        ┌───────▼───────┐
                        │   DynamoDB    │
                        │   Table       │
                        └───────────────┘
```

## Technical Choices

- **Vanilla JavaScript**: Lightweight, no build step required, perfect for static S3 hosting
- **Potree**: Industry-standard point cloud viewer library for 3D visualization (required for Tier 3)
- **Serverless Framework**: Simple YAML-based Infrastructure as Code, easy to deploy and maintain
- **DynamoDB**: Serverless NoSQL database, perfect for this use case with automatic scaling
- **API Gateway + Lambda**: Serverless API that scales automatically, pay-per-use model

**Note**: This is a Tier 3 implementation. Potree is required and must be installed in `frontend/lib/potree/`. The `lion_takanawa` point cloud is included in the Potree pointclouds directory.

## Project Structure

```
unleash-live/
├── frontend/
│   ├── index.html              # Main HTML structure
│   ├── css/
│   │   └── styles.css          # Application styles
│   ├── js/
│   │   ├── app.js              # Main application initialization
│   │   ├── pointCloudViewer.js # Potree viewer integration
│   │   ├── annotationManager.js # Annotation state management
│   │   └── api.js              # API client for backend
│   ├── lib/                    # Potree library files (if using local)
│   └── assets/                 # Point cloud LAZ files
├── backend/
│   ├── functions/
│   │   ├── getAnnotations/
│   │   │   └── index.js        # Lambda: Get all annotations
│   │   ├── createAnnotation/
│   │   │   └── index.js        # Lambda: Create annotation
│   │   └── deleteAnnotation/
│   │       └── index.js        # Lambda: Delete annotation
│   ├── serverless.yml          # Serverless Framework configuration
│   └── package.json            # Backend dependencies
└── README.md                   # This file
```

## Prerequisites

Before deploying, ensure you have:

1. **Node.js** (v18 or higher) and npm installed
2. **AWS CLI** configured with appropriate credentials
3. **Serverless Framework** installed globally:
   ```bash
   npm install -g serverless
   ```
4. An AWS account with permissions to create:
   - Lambda functions
   - API Gateway
   - DynamoDB tables
   - S3 buckets
   - CloudFront distributions (optional)

## Setup Instructions

### 1. Backend Deployment

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Deploy the serverless stack:
   ```bash
   serverless deploy
   ```

4. After deployment, note the API Gateway endpoint URL from the output. It will look like:
   ```
   https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev
   ```

5. Copy this URL - you'll need it for the frontend configuration.

### 2. Frontend Configuration

1. Open `frontend/js/api.js` and update the `API_BASE_URL` constant with your deployed API Gateway endpoint:
   ```javascript
   const API_BASE_URL = 'https://your-api-id.execute-api.us-east-1.amazonaws.com/dev';
   ```

### 3. Frontend Deployment to S3

#### Option A: Using AWS CLI (Recommended)

1. Create an S3 bucket for static hosting:
   ```bash
   aws s3 mb s3://your-bucket-name --region us-east-1
   ```

2. Enable static website hosting:
   ```bash
   aws s3 website s3://your-bucket-name --index-document index.html --error-document index.html
   ```

3. Set bucket policy for public read access:
   ```bash
   aws s3api put-bucket-policy --bucket your-bucket-name --policy '{
     "Version": "2012-10-17",
     "Statement": [{
       "Sid": "PublicReadGetObject",
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::your-bucket-name/*"
     }]
   }'
   ```

4. Sync frontend files to S3:
   ```bash
   aws s3 sync frontend/ s3://your-bucket-name --delete
   ```

5. Your application will be available at:
   ```
   http://your-bucket-name.s3-website-us-east-1.amazonaws.com
   ```

#### Option B: Using AWS Console

1. Create a new S3 bucket in the AWS Console
2. Enable "Static website hosting" in bucket properties
3. Set index document to `index.html`
4. Upload all files from the `frontend/` directory to the bucket root
5. Set bucket policy to allow public read access (see policy above)

### 4. Optional: CloudFront Setup

For better performance and HTTPS support:

1. Create a CloudFront distribution in AWS Console
2. Set origin to your S3 bucket website endpoint
3. Configure default root object as `index.html`
4. Wait for distribution to deploy (15-20 minutes)
5. Access your application via the CloudFront URL

## Local Development

### Running Frontend Locally

You can test the frontend locally using a simple HTTP server:

```bash
# Using Python 3
cd frontend
python -m http.server 8000

# Or using Node.js http-server
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

**Note**: Make sure to update `frontend/js/api.js` with your deployed API Gateway URL before testing locally.

### Testing Backend Locally

You can test Lambda functions locally using Serverless Framework:

```bash
cd backend
serverless invoke local -f getAnnotations
```

## Usage

1. **Load Point Cloud**: Click the "Load Point Cloud" button to load the lion_takanawa point cloud

2. **Create Annotation**: 
   - Click anywhere on the point cloud
   - Enter annotation text (max 256 bytes) in the form
   - Click "Save" to create the annotation

3. **View Annotations**: All annotations appear in the sidebar with their coordinates and text

4. **Delete Annotation**: Click the "Delete" button on any annotation to remove it

5. **Clear All**: Click "Clear All Annotations" to delete all annotations at once

## Point Cloud Files

The application uses the `lion_takanawa` point cloud sample that comes with Potree. It's located at:
- `frontend/lib/potree/pointclouds/lion_takanawa/cloud.js`

To use your own point cloud:

1. Convert your LAZ file to Potree format using [PotreeConverter](https://github.com/potree/PotreeConverter)
2. Place the converted point cloud in `frontend/lib/potree/pointclouds/` or update the path in `frontend/js/app.js`

## API Endpoints

The backend provides the following REST API endpoints:

- `GET /annotations` - Retrieve all annotations
- `POST /annotations` - Create a new annotation
  - Body: `{ "x": number, "y": number, "z": number, "text": string }`
- `DELETE /annotations/{id}` - Delete an annotation by ID

All endpoints return JSON and include CORS headers.

## DynamoDB Schema

The `point-cloud-annotations-{stage}` table has the following structure:

- **Partition Key**: `annotationId` (String)
- **Attributes**:
  - `x` (Number) - X coordinate
  - `y` (Number) - Y coordinate
  - `z` (Number) - Z coordinate
  - `text` (String) - Annotation text (max 256 bytes)
  - `createdAt` (String) - ISO timestamp

## Troubleshooting

### CORS Errors

If you encounter CORS errors, ensure:
1. API Gateway has CORS enabled (already configured in `serverless.yml`)
2. The API Gateway URL in `frontend/js/api.js` is correct
3. The frontend is being served from a valid origin

### API Not Responding

1. Check that the backend is deployed: `cd backend && serverless info`
2. Verify the API Gateway URL is correct in the frontend
3. Check CloudWatch logs: `serverless logs -f getAnnotations`

### Point Cloud Not Loading

1. Ensure Potree library is installed in `frontend/lib/potree/`
2. Verify the point cloud path in `frontend/js/app.js` points to a valid `cloud.js` file
3. Check browser console for errors - common issues include CORS errors or missing files

## Cleanup

To remove all AWS resources:

```bash
cd backend
serverless remove
```

Then manually delete:
- S3 bucket and contents
- CloudFront distribution (if created)

## License

ISC

## Notes

- This is a Tier 3 implementation requiring Potree. The `lion_takanawa` point cloud is included with Potree.
- The application is configured for the `us-east-1` region by default. Update `serverless.yml` to change the region.
- For production use, consider adding authentication, rate limiting, and input validation enhancements.
