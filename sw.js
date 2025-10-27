// 缓存名称（版本号，更新时修改可清除旧缓存）
const CACHE_NAME = 'menu-cache-v1';
// 需要缓存的核心资源
const ASSETS_TO_CACHE = [
  '.',
  'index.html',
  'manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js',
  'https://i.ibb.co/rGbQV6P/46f45c03a87a6203248f509d9a23c8c3.jpg'
];

// 安装阶段：缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting()) // 安装完成后立即激活
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name); // 删除旧版本缓存
          }
        })
      );
    }).then(() => self.clients.claim()) // 控制所有打开的页面
  );
});

// fetch事件：优先从缓存获取资源，失败则请求网络
self.addEventListener('fetch', (event) => {
  // 对Firebase数据库请求直接走网络（需要实时数据）
  if (event.request.url.includes('firebaseio.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 其他资源优先从缓存获取
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 缓存中有则返回，否则请求网络
        return response || fetch(event.request).then((networkResponse) => {
          // 更新缓存（将新请求的资源存入缓存）
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        });
      })
      .catch(() => {
        // 网络也失败时，返回默认页面（适用于完全离线）
        if (event.request.mode === 'navigate') {
          return caches.match('index.html');
        }
      })
  );
});
