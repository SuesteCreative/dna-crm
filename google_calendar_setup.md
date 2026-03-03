# Google Calendar API Setup Instructions

To enable synchronization between the CRM and Google Calendar, please follow these steps:

### 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named `DNA-CRM`.

### 2. Enable Google Calendar API
1. In the sidebar, go to **APIs & Services** > **Library**.
2. Search for "Google Calendar API" and click **Enable**.

### 3. Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**.
2. Select **External** (unless you have a Google Workspace org).
3. Fill in the required app information (App name: `DNA CRM`).
4. Add the scope: `.../auth/calendar.events` (Read/Write access to events).

### 4. Create Credentials
1. Go to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. Select **Web application**.
4. Add Authorized Redirect URI: `http://localhost:3000/api/auth/callback/google` (and your production URL later).
5. **Save the Client ID and Client Secret.**

### 5. Add Credentials to CRM
Update your `.env.local` file with the following:
```env
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
```

---
**Once you have these, let me know and I will help you generate the Refresh Token to keep the sync automatic!**
