# MediQuick Deployment Guide

## 🚀 Google Cloud Platform Deployment

This guide will help you deploy your MediQuick app to Google Cloud Platform (GCP) with all the necessary services.

## Prerequisites

1. **Google Cloud Account**: Create an account at [cloud.google.com](https://cloud.google.com)
2. **Google Cloud CLI**: Install from [cloud.google.com/sdk](https://cloud.google.com/sdk)
3. **Node.js**: Version 16 or higher
4. **Python**: Version 3.9 or higher
5. **Firebase CLI**: `npm install -g firebase-tools`

## 🏗️ Architecture Overview

Your MediQuick app will be deployed using:

- **App Engine**: Node.js backend server
- **Cloud Functions**: Python AI backend
- **Firebase Hosting**: Frontend web app
- **Cloud SQL**: Database (PostgreSQL/MySQL)
- **Cloud Storage**: File uploads and static assets
- **Firebase**: Mobile app backend services

## 📋 Step-by-Step Deployment

### 1. Initial Setup

```bash
# Clone your repository
git clone <your-repo-url>
cd mediquick

# Install dependencies
npm install
pip install -r requirements-cloud.txt

# Authenticate with Google Cloud
gcloud auth login
gcloud auth application-default login

# Create a new project (or use existing)
gcloud projects create mediquick-app-[UNIQUE-ID]
gcloud config set project mediquick-app-[UNIQUE-ID]

# Enable billing (required for deployment)
# Go to: https://console.cloud.google.com/billing
```

### 2. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env with your actual values
nano .env
```

**Required environment variables:**
- `GOOGLE_CLOUD_PROJECT_ID`: Your GCP project ID
- `OPENAI_API_KEY`: Your OpenAI API key
- `MONGODB_URI`: Your database connection string

### 3. Database Setup

#### Option A: MongoDB Atlas (Recommended)
```bash
# 1. Go to https://cloud.mongodb.com
# 2. Create a free cluster
# 3. Get connection string
# 4. Update MONGODB_URI in .env
```

#### Option B: Google Cloud SQL
```bash
# Create Cloud SQL instance
gcloud sql instances create mediquick-db \
    --database-version=POSTGRES_13 \
    --tier=db-f1-micro \
    --region=us-central1

# Create database
gcloud sql databases create mediquick --instance=mediquick-db

# Create user
gcloud sql users create mediquick-user \
    --instance=mediquick-db \
    --password=your-secure-password
```

### 4. Firebase Setup

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select:
# - Hosting
# - Functions (optional)
# - Storage
# - Firestore (for mobile app)

# Update firebase.json configuration
```

### 5. Deploy Using Automated Script

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### 6. Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# Enable required APIs
gcloud services enable appengine.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable sqladmin.googleapis.com

# Deploy Python AI backend
gcloud functions deploy medical-ai-backend \
    --source=. \
    --entry-point=medical_ai_function \
    --runtime=python39 \
    --trigger=http \
    --allow-unauthenticated

# Deploy Node.js backend
gcloud app deploy app.yaml

# Deploy frontend
firebase deploy --only hosting
```

## 🔧 Configuration

### Custom Domain Setup

```bash
# Map custom domain to App Engine
gcloud app domain-mappings create your-domain.com

# Update DNS records as instructed
```

### SSL Certificate

```bash
# SSL is automatically provided by Google Cloud
# For custom domains, certificates are auto-managed
```

### Environment Variables

Set production environment variables:

```bash
# For App Engine
gcloud app deploy app.yaml --set-env-vars="KEY=value"

# For Cloud Functions
gcloud functions deploy medical-ai-backend \
    --set-env-vars="OPENAI_API_KEY=your-key"
```

## 📊 Monitoring and Logging

### Enable Monitoring

```bash
# Enable Cloud Monitoring
gcloud services enable monitoring.googleapis.com

# View logs
gcloud app logs tail -s default
gcloud functions logs read medical-ai-backend
```

### Set Up Alerts

1. Go to [Cloud Monitoring](https://console.cloud.google.com/monitoring)
2. Create alerting policies for:
   - High error rates
   - Response time
   - Resource usage

## 💰 Cost Optimization

### Free Tier Limits

- **App Engine**: 28 instance hours/day
- **Cloud Functions**: 2M invocations/month
- **Firebase Hosting**: 10GB storage, 360MB/day transfer
- **Cloud Storage**: 5GB storage

### Estimated Monthly Costs

- **Light usage** (< 1000 users): $0-20/month
- **Medium usage** (1000-10000 users): $20-100/month
- **Heavy usage** (10000+ users): $100-500/month

## 🔒 Security Best Practices

### 1. API Keys Security

```bash
# Store sensitive keys in Secret Manager
gcloud secrets create openai-api-key --data-file=key.txt

# Use in Cloud Functions
gcloud functions deploy medical-ai-backend \
    --set-env-vars="OPENAI_API_KEY_SECRET=projects/PROJECT/secrets/openai-api-key/versions/latest"
```

### 2. IAM Permissions

```bash
# Create service account for app
gcloud iam service-accounts create mediquick-app

# Grant minimal required permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:mediquick-app@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"
```

### 3. Network Security

- Enable Cloud Armor for DDoS protection
- Use VPC for internal communication
- Enable audit logging

## 🚨 Troubleshooting

### Common Issues

1. **Deployment fails**: Check quotas and billing
2. **Function timeout**: Increase timeout in Cloud Functions
3. **Database connection**: Check firewall rules and credentials
4. **CORS errors**: Update CORS configuration in backend

### Debug Commands

```bash
# Check app status
gcloud app describe

# View recent logs
gcloud app logs tail -s default --num-log-lines=50

# Test function locally
functions-framework --target=medical_ai_function --debug
```

## 📱 Mobile App Deployment

### Android

```bash
# Build APK
cd android
./gradlew assembleRelease

# Upload to Google Play Console
```

### iOS

```bash
# Build for App Store
cd ios
xcodebuild -workspace MediQuick.xcworkspace -scheme MediQuick archive
```

## 🔄 CI/CD Pipeline

The included `cloudbuild.yaml` sets up automatic deployment:

1. Push to main branch triggers build
2. Runs tests
3. Deploys to staging
4. Manual approval for production

## 📞 Support

For deployment issues:

1. Check [Google Cloud Status](https://status.cloud.google.com)
2. Review [App Engine documentation](https://cloud.google.com/appengine/docs)
3. Contact support through Google Cloud Console

## 🎉 Post-Deployment Checklist

- [ ] Test all API endpoints
- [ ] Verify database connectivity
- [ ] Check mobile app functionality
- [ ] Set up monitoring alerts
- [ ] Configure backup strategy
- [ ] Update DNS records
- [ ] Test payment processing
- [ ] Verify AI backend responses
- [ ] Check file upload functionality
- [ ] Test real-time features

Your MediQuick app is now live on Google Cloud Platform! 🚀 