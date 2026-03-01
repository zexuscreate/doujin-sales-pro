const CACHE_NAME = 'doujin-pro-v6';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // index.html / ルートへのリクエストはネットワーク優先
  // → 常に最新版を取得し、オフライン時のみキャッシュを使う
  if (e.request.mode === 'navigate' ||
      url.endsWith('/') ||
      url.endsWith('/index.html')) {
    e.respondWith(
      fetch(e.request)
        .then(function(res) {
          // 取得できたらキャッシュを更新してから返す
          var resClone = res.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, resClone);
          });
          return res;
        })
        .catch(function() {
          // オフライン時はキャッシュから返す
          return caches.match('./index.html');
        })
    );
    return;
  }

  // その他（manifest.json 等）はキャッシュ優先
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).catch(function() {
        return caches.match('./index.html');
      });
    })
  );
});
