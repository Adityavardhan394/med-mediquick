# MediQuick Authentication Setup Guide

This guide will help you set up real-time OTP, Google Sign-In, and Apple Sign-In for your MediQuick application.

## 🔥 Firebase OTP Setup (Real SMS)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. Enable Google Analytics (optional)

### Step 2: Enable Phone Authentication
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Phone** and enable it
3. Click **Save**

### Step 3: Get Firebase Configuration
1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click **Web app** icon (`</>`)
4. Register your app with a nickname
5. Copy the configuration object

### Step 4: Update Configuration in index.html
Replace the Firebase config in `index.html`:

```javascript
firebase: {
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "your-app-id"
}
```

### Step 5: Add Authorized Domains
1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add your domain (e.g., `yourdomain.com`, `localhost`)

### Step 6: Test Phone Numbers (For Development)
1. Go to **Authentication** → **Sign-in method** → **Phone**
2. Scroll down to "Phone numbers for testing"
3. Add test numbers with 6-digit codes (e.g., `+1234567890` → `123456`)

## 🔍 Google Sign-In Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing one

### Step 2: Enable Google+ API
1. Go to **APIs & Services** → **Library**
2. Search for "Google+ API" and enable it

### Step 3: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
5. Copy the **Client ID**

### Step 4: Update Configuration
Replace the Google client ID in `index.html`:

```javascript
auth: {
  google: {
    clientId: "your-google-client-id.apps.googleusercontent.com"
  }
}
```

## 🍎 Apple Sign-In Setup

### Step 1: Apple Developer Account
1. Go to [Apple Developer](https://developer.apple.com/account/)
2. Sign in with your Apple ID (requires paid developer account)

### Step 2: Create App ID
1. Go to **Certificates, Identifiers & Profiles**
2. Click **Identifiers** → **App IDs**
3. Click **+** to register new App ID
4. Select **App** → **Continue**
5. Enter description and Bundle ID
6. Enable **Sign In with Apple**
7. Click **Continue** → **Register**

### Step 3: Create Service ID
1. Go back to **Identifiers**
2. Click **+** → **Services IDs** → **Continue**
3. Enter identifier (e.g., `com.mediquick.signin`)
4. Enable **Sign In with Apple**
5. Click **Configure**
6. Add your domain and return URLs:
   - Domain: `yourdomain.com`
   - Return URL: `https://yourdomain.com/auth/apple/callback`
7. Click **Save** → **Continue** → **Register**

### Step 4: Update Configuration
Replace the Apple configuration in `index.html`:

```javascript
auth: {
  apple: {
    clientId: "com.mediquick.signin", // Your Service ID
    scope: "name email",
    redirectUri: "https://yourdomain.com/auth/apple/callback"
  }
}
```

## 🧪 Testing the Authentication

### Test Real OTP
1. Use your actual phone number
2. You should receive real SMS
3. For development, use Firebase test numbers

### Test Google Sign-In
1. Click "Sign in with Google"
2. Google popup should appear
3. Complete sign-in flow

### Test Apple Sign-In
1. Click "Sign in with Apple"
2. Apple popup should appear
3. Complete sign-in flow

## 🔧 Troubleshooting

### Firebase OTP Issues
- **No SMS received**: Check phone number format (+91xxxxxxxxxx)
- **Captcha issues**: Ensure domain is authorized
- **Console errors**: Check API key and project configuration

### Google Sign-In Issues
- **Popup blocked**: Allow popups for your domain
- **Invalid client**: Check client ID and authorized domains
- **CORS errors**: Verify JavaScript origins

### Apple Sign-In Issues
- **Domain not verified**: Check domain verification in Apple console
- **Redirect issues**: Verify return URLs match exactly
- **Authorization errors**: Ensure Service ID is configured properly

## 📱 Production Deployment

### Security Checklist
- [ ] Remove test phone numbers from Firebase
- [ ] Add production domains to all services
- [ ] Enable reCAPTCHA for phone auth
- [ ] Set up proper HTTPS
- [ ] Configure CSP headers
- [ ] Test all authentication flows

### Environment Variables
Consider using environment variables for sensitive configuration:

```javascript
const config = {
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    // ... other config
  }
};
```

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify all configuration values
3. Test with different browsers/devices
4. Check network connectivity

---

**Note**: All authentication services require HTTPS in production. Use `localhost` or `127.0.0.1` for local development. 