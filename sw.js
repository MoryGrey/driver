const CACHE_NAME = 'prestige-taxi-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

// Установка service worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Активация service worker
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Перехват запросов
self.addEventListener('fetch', function(event) {
  // Если это запрос к корню приложения, проверяем данные пользователя
  if (event.request.url.endsWith('/driver/') || event.request.url.endsWith('/driver')) {
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          if (response) {
            return response;
          }
          // Загружаем из сети
          return fetch(event.request);
        })
        .catch(function() {
          // Если нет кэша и нет сети, возвращаем базовую страницу
          return caches.match('/driver/index.html');
        })
    );
  } else if (event.request.url.includes('manifest.json')) {
    // Специальная обработка для manifest.json
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          // Кэшируем manifest
          const responseClone = response.clone();
          caches.open('pwa-cache-v1').then(function(cache) {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(function() {
          // Если нет сети, возвращаем кэшированный manifest
          return caches.match(event.request);
        })
    );
  } else {
    // Обычная обработка для других запросов
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          if (response) {
            return response;
          }
          return fetch(event.request);
        })
    );
  }
});

// Обработка push уведомлений
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'Новое уведомление от ПРЕСТИЖ',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Открыть приложение',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Закрыть',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('ПРЕСТИЖ - Такси', options)
  );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
