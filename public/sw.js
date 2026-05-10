// v3: インストール失敗で古いSWが残り続けるバグを修正
// skipWaiting を即時呼び出しに変更し、/_next/static/ のみキャッシュ

const CACHE = 'diary-v3';

// install: プリキャッシュなし、即座に新バージョンへ切り替え
self.addEventListener('install', () => {
  self.skipWaiting();
});

// activate: 古いキャッシュを全削除してから制御を取得
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // /_next/static/ のみキャッシュ（コンテンツハッシュ付き、安全に永続キャッシュ可能）
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE).then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // それ以外（HTML・画像・API）はブラウザ本来の動作に任せる
});
