# Google OAuth Setup for Localhost

## Quick Setup Steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen (add your email as test user)
6. Create OAuth Client ID:
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000` and `http://localhost:3004`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`

7. Copy your Client ID and Client Secret

8. Add to your `.env` file:
```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

9. Install packages:
```
npm install passport passport-google-oauth20
```

10. Restart your server
