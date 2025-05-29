#!/bin/bash

# MediQuick Deployment Script for Google Cloud Platform
# Make sure you have gcloud CLI installed and authenticated

set -e

echo "🚀 Starting MediQuick deployment to Google Cloud Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}⚠️  You are not authenticated with gcloud. Please run:${NC}"
    echo "gcloud auth login"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ No project set. Please run:${NC}"
    echo "gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${BLUE}📋 Project ID: $PROJECT_ID${NC}"

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required Google Cloud APIs...${NC}"
gcloud services enable appengine.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable firebase.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable vision.googleapis.com

# Create App Engine app if it doesn't exist
echo -e "${YELLOW}🏗️  Setting up App Engine...${NC}"
if ! gcloud app describe &> /dev/null; then
    echo "Creating App Engine application..."
    gcloud app create --region=us-central1
fi

# Deploy Python AI backend as Cloud Function
echo -e "${YELLOW}🐍 Deploying Python AI backend to Cloud Functions...${NC}"
gcloud functions deploy medical-ai-backend \
    --source=. \
    --entry-point=medical_ai_function \
    --runtime=python39 \
    --trigger=http \
    --allow-unauthenticated \
    --memory=512MB \
    --timeout=60s \
    --region=us-central1

# Deploy Node.js backend to App Engine
echo -e "${YELLOW}🟢 Deploying Node.js backend to App Engine...${NC}"
gcloud app deploy app.yaml --quiet

# Deploy frontend to Firebase Hosting (if firebase.json exists)
if [ -f "firebase.json" ]; then
    echo -e "${YELLOW}🔥 Deploying frontend to Firebase Hosting...${NC}"
    if command -v firebase &> /dev/null; then
        firebase deploy --only hosting
    else
        echo -e "${YELLOW}⚠️  Firebase CLI not found. Install it with: npm install -g firebase-tools${NC}"
    fi
fi

# Get deployment URLs
APP_ENGINE_URL=$(gcloud app describe --format="value(defaultHostname)")
FUNCTION_URL=$(gcloud functions describe medical-ai-backend --region=us-central1 --format="value(httpsTrigger.url)")

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📱 Your MediQuick app is now live:${NC}"
echo -e "${GREEN}🌐 Main App: https://$APP_ENGINE_URL${NC}"
echo -e "${GREEN}🤖 AI Backend: $FUNCTION_URL${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Set up your database (Cloud SQL)"
echo "2. Configure environment variables"
echo "3. Set up monitoring and logging"
echo "4. Configure custom domain (optional)"
echo ""
echo -e "${BLUE}💡 Useful commands:${NC}"
echo "• View logs: gcloud app logs tail -s default"
echo "• View function logs: gcloud functions logs read medical-ai-backend"
echo "• Update app: gcloud app deploy"
echo "" 