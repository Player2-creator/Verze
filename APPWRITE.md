Appwrite setup

Required environment variables (add to your Expo env or .env):

- `EXPO_PUBLIC_APPWRITE_PROJECT_ID` (already provided)
- `EXPO_PUBLIC_APPWRITE_ENDPOINT` (already provided)
 - `EXPO_PUBLIC_APPWRITE_PROJECT_NAME` (project display name)
- `EXPO_PUBLIC_APPWRITE_DATABASE_ID` (Appwrite Database ID)
- `EXPO_PUBLIC_APPWRITE_COLLECTION_ID` (Collection ID for posts)

Example `app.json` addition (under `expo.extra`):

```
"EXPO_PUBLIC_APPWRITE_PROJECT_ID": "6a1ccfee003c01f895cf",
"EXPO_PUBLIC_APPWRITE_PROJECT_NAME": "Verze",
"EXPO_PUBLIC_APPWRITE_ENDPOINT": "https://nyc.cloud.appwrite.io/v1",
"EXPO_PUBLIC_APPWRITE_DATABASE_ID": "<YOUR_DATABASE_ID>",
"EXPO_PUBLIC_APPWRITE_COLLECTION_ID": "<YOUR_COLLECTION_ID>"
```

Example `.env` entries:

```
EXPO_PUBLIC_APPWRITE_PROJECT_ID=6a1ccfee003c01f895cf
EXPO_PUBLIC_APPWRITE_PROJECT_NAME=Verze
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_DATABASE_ID=<YOUR_DATABASE_ID>
EXPO_PUBLIC_APPWRITE_COLLECTION_ID=<YOUR_COLLECTION_ID>
EXPO_PUBLIC_APPWRITE_BUCKET_ID=<YOUR_BUCKET_ID>
```

Or add these to a `.env` and configure your project to load them into `process.env` for local development.

Notes:
- Create a database and a collection (e.g., `posts`) in your Appwrite console.
- Ensure the collection has readable permissions for your client or configure rules so creating documents is allowed for unauthenticated users if needed.

Usage:
- The `Create` screen uses `createPost` to insert documents into the collection.
- The `index` screen fetches documents via `getPosts` and displays them.
