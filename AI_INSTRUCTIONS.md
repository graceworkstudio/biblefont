# 🚨 AI Assistant Instructions & Project Architecture 🚨

## Architecture Overview
- **Frontend (Live UI):** Hosted on **Cafe24**. The domain `biblezoom.co.kr` points to Cafe24. The React application (built in `dist`) is injected into Cafe24's HTML files (e.g., via `scratch_replace_ui.py`).
- **Backend (API Proxy):** Hosted on **Firebase**. The Firebase project (`biblefont.web.app`) is strictly used as a backend API proxy (Cloud Functions) to fetch data from Cafe24's Admin API safely without exposing the `CAFE24_ACCESS_TOKEN` to the client. It also hosts some static image assets (like Kakao share thumbnails).

## 🛑 CRITICAL WARNING FOR AI ASSISTANTS 🛑
1. **DO NOT** assume the main frontend is hosted on Firebase. 
2. **DO NOT** attempt to run `firebase deploy` to update the frontend UI. The frontend must be applied to Cafe24.
3. If you run `firebase deploy`, understand that you are ONLY updating the Cloud Functions or the static proxy endpoints, NOT the live user-facing web app.
4. Keep the `.firebase`, `firebase.json`, and `.firebaserc` files intact, as they are required for the Cloud Functions backend.

## Current Focus
- Fetch optimization for Cafe24 product variants.
- Cafe24 API integration testing.
