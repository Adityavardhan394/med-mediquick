@echo off
REM MediQuick Deployment Script for Google Cloud Platform (Windows)
REM Make sure you have gcloud CLI installed and authenticated

echo 🚀 Starting MediQuick deployment to Google Cloud Platform...

REM Check if gcloud is installed
where gcloud >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ gcloud CLI is not installed. Please install it first.
    echo Visit: https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

REM Check if user is authenticated
gcloud auth list --filter=status:ACTIVE --format="value(account)" | findstr /r ".*" >nul
if %errorlevel% neq 0 (
    echo ⚠️  You are not authenticated with gcloud. Please run:
    echo gcloud auth login
    pause
    exit /b 1
)

REM Get project ID
for /f "tokens=*" %%i in ('gcloud config get-value project 2^>nul') do set PROJECT_ID=%%i
if "%PROJECT_ID%"=="" (
    echo ❌ No project set. Please run:
    echo gcloud config set project YOUR_PROJECT_ID
    pause
    exit /b 1
)

echo 📋 Project ID: %PROJECT_ID%

REM Enable required APIs
echo 🔧 Enabling required Google Cloud APIs...
gcloud services enable appengine.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable firebase.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable vision.googleapis.com

REM Create App Engine app if it doesn't exist
echo 🏗️  Setting up App Engine...
gcloud app describe >nul 2>nul
if %errorlevel% neq 0 (
    echo Creating App Engine application...
    gcloud app create --region=us-central1
)

REM Deploy Python AI backend as Cloud Function
echo 🐍 Deploying Python AI backend to Cloud Functions...
gcloud functions deploy medical-ai-backend --source=. --entry-point=medical_ai_function --runtime=python39 --trigger=http --allow-unauthenticated --memory=512MB --timeout=60s --region=us-central1

REM Deploy Node.js backend to App Engine
echo 🟢 Deploying Node.js backend to App Engine...
gcloud app deploy app.yaml --quiet

REM Deploy frontend to Firebase Hosting (if firebase.json exists)
if exist firebase.json (
    echo 🔥 Deploying frontend to Firebase Hosting...
    where firebase >nul 2>nul
    if %errorlevel% equ 0 (
        firebase deploy --only hosting
    ) else (
        echo ⚠️  Firebase CLI not found. Install it with: npm install -g firebase-tools
    )
)

REM Get deployment URLs
for /f "tokens=*" %%i in ('gcloud app describe --format="value(defaultHostname)" 2^>nul') do set APP_ENGINE_URL=%%i
for /f "tokens=*" %%i in ('gcloud functions describe medical-ai-backend --region=us-central1 --format="value(httpsTrigger.url)" 2^>nul') do set FUNCTION_URL=%%i

echo.
echo ✅ Deployment completed successfully!
echo.
echo 📱 Your MediQuick app is now live:
echo 🌐 Main App: https://%APP_ENGINE_URL%
echo 🤖 AI Backend: %FUNCTION_URL%
echo.
echo 📋 Next steps:
echo 1. Set up your database (Cloud SQL)
echo 2. Configure environment variables
echo 3. Set up monitoring and logging
echo 4. Configure custom domain (optional)
echo.
echo 💡 Useful commands:
echo • View logs: gcloud app logs tail -s default
echo • View function logs: gcloud functions logs read medical-ai-backend
echo • Update app: gcloud app deploy
echo.
pause 