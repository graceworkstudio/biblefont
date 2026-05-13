import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// PWA Service Worker Registration & Update Logic
// PWA 업데이트 알림 수동 제어 플래그 (true일 때만 알림 표시)
const ENABLE_AUTO_UPDATE_BANNER = false;

/*
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(reg => {
            function showUpdateBanner(worker) {
                if (!ENABLE_AUTO_UPDATE_BANNER) return; // 수동 요청 시에만 표시하도록 제한
                const banner = document.getElementById('update-banner');
                if (!banner) return;
                banner.classList.add('show');
                
                document.getElementById('update-btn').onclick = () => {
                    worker.postMessage({ type: 'SKIP_WAITING' });
                    banner.classList.remove('show');
                };
                
                document.getElementById('update-later').onclick = () => {
                    banner.classList.remove('show');
                };
            }

            if (reg.waiting) {
                showUpdateBanner(reg.waiting);
            }

            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateBanner(newWorker);
                    }
                });
            });

            // 즉시 업데이트 확인 및 주기적 체크 (1시간)
            reg.update();
            setInterval(() => {
                reg.update();
            }, 1000 * 60 * 60);

            // 화면 가시성 변경 시 체크
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    reg.update();
                }
            });
        });

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                window.location.reload();
                refreshing = true;
            }
        });
    });
}
*/
