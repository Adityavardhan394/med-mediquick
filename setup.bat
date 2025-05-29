@echo off
REM MediQuick Setup Script for Windows
echo 🚀 MediQuick Setup Script

echo.
echo 📋 This script will help you set up your development environment for MediQuick deployment.
echo.

REM Check Node.js
echo 🟢 Checking Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install it from: https://nodejs.org
    echo Recommended version: 18 LTS
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✅ Node.js version: %%i
)

REM Check Python
echo 🐍 Checking Python...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install it from: https://python.org
    echo Recommended version: 3.9 or higher
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('python --version') do echo ✅ Python version: %%i
)

REM Check gcloud CLI
echo ☁️  Checking Google Cloud CLI...
where gcloud >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Google Cloud CLI is not installed.
    echo.
    echo Please install it from: https://cloud.google.com/sdk/docs/install
    echo.
    echo After installation, run:
    echo   gcloud auth login
    echo   gcloud config set project YOUR_PROJECT_ID
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('gcloud version --format="value(Google Cloud SDK)"') do echo ✅ Google Cloud CLI version: %%i
)

REM Install Node.js dependencies
echo 📦 Installing Node.js dependencies...
if exist package.json (
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Node.js dependencies
        pause
        exit /b 1
    )
    echo ✅ Node.js dependencies installed
) else (
    echo ⚠️  package.json not found
)

REM Install Python dependencies
echo 🐍 Installing Python dependencies...
if exist requirements-cloud.txt (
    pip install -r requirements-cloud.txt
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Python dependencies
        pause
        exit /b 1
    )
    echo ✅ Python dependencies installed
) else (
    echo ⚠️  requirements-cloud.txt not found
)

REM Install Firebase CLI
echo 🔥 Checking Firebase CLI...
where firebase >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing Firebase CLI...
    npm install -g firebase-tools
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Firebase CLI
        pause
        exit /b 1
    )
    echo ✅ Firebase CLI installed
) else (
    echo ✅ Firebase CLI already installed
)

REM Create environment file
echo 📝 Setting up environment configuration...
if not exist .env (
    if exist env.example (
        copy env.example .env
        echo ✅ Created .env file from template
        echo.
        echo ⚠️  IMPORTANT: Please edit .env file with your actual values:
        echo   - GOOGLE_CLOUD_PROJECT_ID
        echo   - OPENAI_API_KEY
        echo   - MONGODB_URI
        echo   - Other required variables
        echo.
    ) else (
        echo ⚠️  env.example not found
    )
) else (
    echo ✅ .env file already exists
)

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Edit .env file with your actual values
echo 2. Create a Google Cloud project: gcloud projects create mediquick-app-[UNIQUE-ID]
echo 3. Set the project: gcloud config set project mediquick-app-[UNIQUE-ID]
echo 4. Enable billing in Google Cloud Console
echo 5. Run deploy.bat to deploy your app
echo.
echo 💡 Useful commands:
echo   • Test locally: npm start
echo   • Deploy to cloud: deploy.bat
echo   • View logs: gcloud app logs tail -s default
echo.
pause 