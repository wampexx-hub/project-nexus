# UploadThing Setup Required

To enable file uploads, you need to:

1. **Create an UploadThing Account**:
   - Go to https://uploadthing.com
   - Sign up/Login
   - Create a new app

2. **Get API Keys**:
   - Copy your `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`

3. **Add to Environment Variables**:
   - Create/Update `apps/web/.env.local`:
     ```
     UPLOADTHING_SECRET=your_secret_here
     UPLOADTHING_APP_ID=your_app_id_here
     ```

4. **Restart the Dev Server**:
   ```
   npm run dev
   ```

Once configured, users will be able to upload images and PDFs in chat.
