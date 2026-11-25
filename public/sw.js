const CACHE_NAME = 'biblezoom-v1.0.3'; // 버전 변경 → 강제 캐시 갱신
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: 정적 에셋만 캐시 (index.html 제외)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: 구버전 캐시 삭제 + 즉시 모든 클라이언트 제어
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch 전략:
// - index.html → 항상 네트워크 우선 (Network First) → 최신 GA 코드 보장
// - JS/CSS 해시 에셋 → 캐시 우선 (Cache First) → 빠른 로딩
// - 외부 도메인 → 통과 (GA, Kakao SDK 등)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 외부 요청은 캐시하지 않음
  if (url.origin !== self.location.origin) return;

  const isHTML = url.pathname === '/' || url.pathname.endsWith('.html');
  const isHashedAsset = /\/assets\/.*\.[a-f0-9]{8}\.(js|css)$/.test(url.pathname);

  if (isHTML) {
    // Network First: 항상 서버에서 최신 HTML 가져오기
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else if (isHashedAsset) {
    // Cache First: 해시된 JS/CSS는 변경되지 않으므로 캐시 우선
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
  }
  // 그 외: 기본 네트워크 요청 (SW 개입 없음)
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
