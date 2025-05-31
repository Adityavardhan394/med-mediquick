// API Keys Configuration
const config = {
    googleMaps: {
        apiKey: 'AIzaSyBNLrJhOMz6idD05pzfn5lhA-TAw-mAZCU' // Valid API key with HTTP restrictions
    },
    auth: {
        google: {
            clientId: 'YOUR_GOOGLE_CLIENT_ID', // TODO: Replace with your Google OAuth client ID
            scope: 'email profile'
        },
        apple: {
            clientId: 'YOUR_APPLE_CLIENT_ID', // TODO: Replace with your Apple Sign In client ID
            scope: 'name email',
            redirectUri: window.location.origin + '/auth/apple/callback'
        }
    },
    api: {
        baseUrl: 'https://api.example.com' // TODO: Replace with your actual API base URL
    }
};