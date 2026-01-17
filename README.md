# Point Cloud Annotator

A full-stack serverless web application for loading, viewing, and annotating 3D point clouds. Built with vanilla JavaScript frontend, AWS Lambda, API Gateway, and DynamoDB.

**🌐 Live Application**: [http://point-cloud-annotator-frontend.s3-website-ap-southeast-2.amazonaws.com](http://point-cloud-annotator-frontend.s3-website-ap-southeast-2.amazonaws.com)

**📦 Repository**: [https://github.com/basanta11/unleash-live](https://github.com/basanta11/unleash-live)

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

This section explains the rationale behind each technology choice:

### Frontend: Vanilla JavaScript
I chose **vanilla JavaScript** instead of frameworks like React or Vue because:
- **No build step required**: Static S3 hosting doesn't require transpilation or bundling, making deployment simpler
- **Lightweight**: No framework overhead reduces page load time, important for 3D point cloud rendering
- **Direct DOM manipulation**: Works seamlessly with Potree's existing DOM-based API without framework integration layers
- **Simple deployment**: Files can be directly synced to S3 without build processes or CD pipeline complexity

### Point Cloud Viewer: Potree
I chose **Potree** because:
- **Tier 3 requirement**: Potree is explicitly required for Tier 3 implementation as per project specifications
- **Industry standard**: Potree is the most widely-used open-source point cloud viewer, with excellent LAZ/LAZ file support
- **Performance**: Handles large point clouds efficiently with level-of-detail (LOD) rendering and adaptive point sizing
- **Feature-rich**: Built-in annotation system, measurement tools, and camera controls out of the box

### Backend: Serverless Framework
I chose **Serverless Framework** because:
- **Infrastructure as Code**: Define all AWS resources (Lambda, API Gateway, DynamoDB) in a single YAML file
- **Easy deployment**: Single command (`serverless deploy`) handles all resource creation and updates
- **Cost-effective**: No build servers or deployment infrastructure needed - deploy directly from development machine
- **AWS-agnostic abstraction**: Cleaner syntax than raw CloudFormation, easier to understand and maintain

### Database: DynamoDB
I chose **DynamoDB** because:
- **Fully managed**: No server provisioning, patching, or scaling concerns - AWS handles everything
- **Serverless architecture fit**: Perfect match for Lambda functions - both scale automatically with usage
- **Cost-effective for this use case**: Pay-per-request pricing model ideal for annotation CRUD operations with low-moderate traffic
- **Fast read/write**: Single-digit millisecond latency for simple queries, sufficient for annotation storage

### API: AWS Lambda + API Gateway
I chose **AWS Lambda + API Gateway** because:
- **Tier 3 requirement**: Serverless backend is required for Tier 3 implementation
- **Automatic scaling**: Handles traffic spikes without manual scaling configuration
- **Cost-effective**: Pay only for actual request processing, no idle server costs
- **CORS support**: Built-in CORS configuration for frontend-backend communication
- **RESTful design**: API Gateway provides clean REST endpoints that map directly to Lambda functions

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

## Running the Project Locally

Follow these step-by-step instructions to run the application on your local machine:

### Step 1: Clone the Repository

```bash
git clone https://github.com/basanta11/unleash-live.git
cd unleash-live
```

### Step 2: Start the Backend Locally (Recommended for Development)

The backend can run locally using `serverless-offline`, which simulates AWS Lambda and API Gateway on your machine.

**Option A: Run Backend Locally (Recommended)**

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local server:**
   ```bash
   npm start
   # or
   npm run offline
   # or
   serverless offline
   ```

4. The backend will start on `http://localhost:3000` with the API available at:
   ```
   http://localhost:3000/dev
   ```

**Note**: For local backend, you'll need AWS credentials configured for DynamoDB access, or use [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html) for fully offline development.

**Option B: Use Deployed Backend (Production API)**

If you prefer to use the deployed backend:

1. **Deploy the serverless stack:**
   ```bash
   cd backend
   npm install
   serverless deploy
   ```

2. **Note the API Gateway URL** from the deployment output. It will look like:
   ```
   https://aj6m5tp44h.execute-api.ap-southeast-2.amazonaws.com/dev
   ```

### Step 3: Configure the Frontend API URL

The frontend API URL is configured in `frontend/js/config.js`. You can change it in two ways:

**Option A: Edit config.js Directly (Simple)**

1. **Open `frontend/js/config.js`** in a text editor

2. **Update the `API_BASE_URL`** for your environment:
   ```javascript
   // For local backend (serverless-offline)
   const API_BASE_URL = 'http://localhost:3000/dev';
   
   // For deployed backend (production)
   const API_BASE_URL = 'https://aj6m5tp44h.execute-api.ap-southeast-2.amazonaws.com/dev';
   ```

**Option B: Use Local Config Override (Advanced)**

1. **Copy the example local config:**
   ```bash
   cd frontend/js
   cp config.local.js.example config.local.js
   ```

2. **Edit `config.local.js`** to set your local API URL:
   ```javascript
   const API_BASE_URL = 'http://localhost:3000/dev';
   ```

3. **Update `frontend/index.html`** to load `config.local.js` instead of `config.js`:
   ```html
   <script src="js/config.local.js"></script>
   ```

**Note**: `config.local.js` is in `.gitignore` and won't be committed to version control.

### Step 4: Start the Frontend Local Server

Since the frontend uses ES6 modules and requires HTTP (not file:// protocol), you need a local web server:

**Option A: Using Python 3 (Recommended)**
```bash
cd frontend
python -m http.server 8000
```

**Option B: Using Node.js http-server**
```bash
# Install http-server globally if not already installed
npm install -g http-server

# Navigate to frontend directory
cd frontend

# Start the server
http-server -p 8000
```

**Option C: Using PHP**
```bash
cd frontend
php -S localhost:8000
```

### Step 5: Open the Application

1. Open your web browser
2. Navigate to: `http://localhost:8000`
3. The point cloud should automatically load when the page loads

### Step 6: Test Functionality

1. **Load Point Cloud**: The `lion_takanawa` point cloud should load automatically on page load
2. **Create Annotation**: 
   - Click anywhere on the point cloud
   - You should see the clicked coordinates displayed above the annotation form
   - Enter annotation text (max 256 bytes)
   - Click "Save" to create the annotation
3. **View Annotations**: Check that annotations appear in the sidebar
4. **Delete Annotation**: Click the delete button (×) on any annotation to remove it

### Using DynamoDB Locally (Optional)

For fully offline development without AWS credentials, you can use DynamoDB Local:

1. **Download DynamoDB Local** from [AWS Documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html)

2. **Start DynamoDB Local:**
   ```bash
   java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
   ```

3. **Configure serverless-offline to use local DynamoDB** by setting the DynamoDB endpoint in your environment or serverless.yml

### Testing Backend Functions

**With serverless-offline running:**

The API is available at `http://localhost:3000/dev`. Test endpoints directly:

```bash
# Get all annotations
curl http://localhost:3000/dev/annotations

# Create annotation
curl -X POST http://localhost:3000/dev/annotations \
  -H "Content-Type: application/json" \
  -d '{"x": 1, "y": 2, "z": 3, "text": "Test annotation"}'

# Delete annotation
curl -X DELETE http://localhost:3000/dev/annotations/{id}
```

**Using Serverless Framework invoke:**

```bash
cd backend

# Test getAnnotations function
serverless invoke local -f getAnnotations

# Test createAnnotation function
serverless invoke local -f createAnnotation --data '{"body": "{\"x\": 1, \"y\": 2, \"z\": 3, \"text\": \"Test annotation\"}"}'

# Test deleteAnnotation function
serverless invoke local -f deleteAnnotation --data '{"pathParameters": {"id": "your-annotation-id"}}'
```

### Troubleshooting Local Development

- **CORS errors**: 
  - For local backend: Ensure `serverless-offline` is running and CORS is enabled in `serverless.yml`
  - For deployed backend: Verify the API Gateway URL in `frontend/js/config.js` is correct
- **Backend not starting**: 
  - Ensure Node.js v18+ is installed
  - Run `npm install` in the backend directory to install `serverless-offline`
  - Check AWS credentials are configured if using real DynamoDB
- **API calls failing**: 
  - Verify the backend is running (`http://localhost:3000/dev` for local)
  - Check browser console for CORS errors
  - Verify the API URL in `frontend/js/config.js` matches your backend
- **Point cloud not loading**: Check browser console for 404 errors - ensure Potree library files are in `frontend/lib/potree/`

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
- The application is deployed to the `ap-southeast-2` (Sydney) region. Update `serverless.yml` and `deploy-frontend.ps1` to change the region.
- For production use, consider adding authentication, rate limiting, and input validation enhancements.
- **Repository**: Full source code is available at [https://github.com/basanta11/unleash-live](https://github.com/basanta11/unleash-live)