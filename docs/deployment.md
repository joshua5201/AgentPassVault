# Google Cloud Run Deployment Guide

This guide describes how to deploy the AgentPassVault application (Backend + Web UI) to Google Cloud Run using a single container approach. The Web UI will be bundled into the Spring Boot backend and served as static resources.

## Prerequisites

*   **Google Cloud Project**: You must have a GCP project created.
*   **Google Cloud CLI (`gcloud`)**: Installed and authenticated (`gcloud auth login`).
*   **Docker**: Installed (required for local frontend build, though Jib builds the backend image without a local Docker daemon).
*   **Node.js & pnpm**: Required to build the frontend.
*   **Java 21**: Required for the backend build.

## 1. Environment Configuration

Set up environment variables to reuse across commands. Adjust these values to match your preferences.

```bash
# Project Configuration
export PROJECT_ID="your-project-id"
export REGION="us-central1"

# Resource Names
export REPO_NAME="agentpassvault-repo"
export SERVICE_NAME="agentpassvault"
export IMAGE_NAME="agentpassvault-backend"
export DB_INSTANCE_NAME="agentpassvault-db"
export DB_NAME="agentpassvault"
export DB_USER="vault_user"

# Secrets (Change these!)
export DB_PASSWORD="secure-database-password"
export MASTER_KEY_PASSWORD="your-master-key-password" # Example if needed by app logic

# Set the project
gcloud config set project $PROJECT_ID
```

## 2. Infrastructure Setup

Enable necessary APIs and create the resources.

### Enable APIs
```bash
gcloud services enable 
  run.googleapis.com 
  sqladmin.googleapis.com 
  artifactregistry.googleapis.com 
  secretmanager.googleapis.com 
  compute.googleapis.com
```

### Create Artifact Registry
Create a Docker repository to store your container images.
```bash
gcloud artifacts repositories create $REPO_NAME 
  --repository-format=docker 
  --location=$REGION 
  --description="Docker repository for AgentPassVault"
```

### Create Cloud SQL Instance (MySQL)
Create a MySQL 8.0 instance. This may take a few minutes.
```bash
gcloud sql instances create $DB_INSTANCE_NAME 
  --database-version=MYSQL_8_0 
  --cpu=1 
  --memory=4GB 
  --region=$REGION 
  --root-password=$DB_PASSWORD
```

### Create Database and User
```bash
gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE_NAME

gcloud sql users create $DB_USER 
  --instance=$DB_INSTANCE_NAME 
  --password=$DB_PASSWORD
```

## 3. Build & Bundle Frontend

Build the React application and copy the artifacts to the Spring Boot static resources directory.

```bash
# Navigate to frontend
cd frontend

# Install dependencies
pnpm install

# Build the Web UI
pnpm --filter web build

# Copy artifacts to Backend
# Ensure the target directory exists and is empty
rm -rf ../src/main/resources/static/*
cp -r apps/web/dist/* ../src/main/resources/static/

# Return to root
cd ..
```

## 4. Build & Push Backend Image

Use Jib to build the container image and push it directly to Artifact Registry. No local Docker daemon is required for this step.

```bash
# Construct the full image path
export IMAGE_PATH="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME"

# Build and Push
./gradlew jib -Djib.to.image=$IMAGE_PATH
```

## 5. Deploy to Cloud Run

Deploy the container. We will enable Flyway migrations on startup (`SPRING_FLYWAY_ENABLED=true`) to ensure the database schema is created.

**Note:** We use the `--add-cloudsql-instances` flag to securely connect to Cloud SQL via the Unix socket.

```bash
gcloud run deploy $SERVICE_NAME 
  --image=$IMAGE_PATH 
  --region=$REGION 
  --platform=managed 
  --allow-unauthenticated 
  --add-cloudsql-instances=$PROJECT_ID:$REGION:$DB_INSTANCE_NAME 
  --set-env-vars="SPRING_DATASOURCE_URL=jdbc:mysql:///$DB_NAME?cloudSqlInstance=$PROJECT_ID:$REGION:$DB_INSTANCE_NAME&socketFactory=com.google.cloud.sql.mysql.SocketFactory" 
  --set-env-vars="SPRING_DATASOURCE_USERNAME=$DB_USER" 
  --set-env-vars="SPRING_DATASOURCE_PASSWORD=$DB_PASSWORD" 
  --set-env-vars="SPRING_JPA_HIBERNATE_DDL_AUTO=validate" 
  --set-env-vars="SPRING_FLYWAY_ENABLED=true"
```

### Verification
After deployment, `gcloud` will output a Service URL (e.g., `https://agentpassvault-xyz-uc.a.run.app`).
1.  Open the URL in your browser. You should see the Web UI.
2.  The API is available at `/api/v1/...`.

## 6. (Optional) Security Improvements

For a production environment, avoid passing passwords as plain text environment variables.

1.  **Secret Manager**: Store `DB_PASSWORD` in Google Secret Manager.
2.  **Cloud Run Secrets**: Reference the secret in the deploy command.

```bash
# Create Secret
echo -n $DB_PASSWORD | gcloud secrets create db-password --data-file=-

# Deploy with Secret Reference
gcloud run deploy $SERVICE_NAME 
  ... 
  --set-secrets="SPRING_DATASOURCE_PASSWORD=db-password:latest"
```
