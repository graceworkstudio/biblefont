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

## 가격·품절 동기화 (2026-11-25 추가)
- 카페24 관리자 API는 쓰지 않는다. `scripts/sync-cafe24.mjs` 가 공개 상품 페이지를 읽어 `status.json` 을 만든다.
- GitHub Actions `sync-prices.yml` 이 하루 한 번 실행해 `live-data` 브랜치에 올린다. main 은 건드리지 않는다.
- 앱은 `src/data/liveStatus.js` 로 그 파일을 읽어 `bibleData` 위에 덮어쓴다(가격 갱신, 품절·삭제 숨김, 같은 ISBN의 인상된 새 상품으로 연결). 못 읽으면 `bibleData.js` 그대로.
- **주문 흐름(`getProductItemCode`, `quietlyAddToCart`, `handleBatchCheckout`, `batch_order` 처리)은 건드리지 않는다.** 어렵게 맞춰 놓은 부분이다.
- 운영본과 일치하는 소스는 이 폴더(`~/.gemini/antigravity-ide/...`)다. `~/.gemini/antigravity/...` 는 옛 사본이다.
- 새 책을 `bibleData.js` 에 넣은 뒤 `node scripts/sync-cafe24.mjs --out sync-out --write-base` 를 돌리면 ISBN·가격·item_code 가 채워진다.
