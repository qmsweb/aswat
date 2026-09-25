/*
 * Service Worker لموقع صوامت
 * يخزّن الشعار والصور والملفات الثابتة في المتصفح لتجنّب تحميلها كل مرة.
 * هذا الملف لا يخزّن بيانات شخصية ولا يرسل أي طلبات خارج نطاق الموقع.
 */
var CACHE_VERSION = 'sawamet-v4';
var CORE_CACHE = 'sawamet-core-' + CACHE_VERSION;
var IMAGE_CACHE = 'sawamet-images-' + CACHE_VERSION;
var FONT_CACHE = 'sawamet-fonts-' + CACHE_VERSION;

var CORE_ASSETS = [
  './',
  './css/style.css',
  './css/fonts.css',
  './script.js',
  './menu.js',
  './images/sawamet-logo.png',
  './icons/favicon.png'
];

/* الخطوط تُخزَّن في ذاكرة دائمة وتُقرأ منها أولاً دائماً،
   فالانتقال بين الصفحات لا يعيد تنزيلها. */
var FONT_ASSETS = [
  './fonts/thmanyahsans-Regular.otf',
  './fonts/thmanyahsans-Medium.otf',
  './fonts/thmanyahsans-Bold.otf'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CORE_CACHE).then(function (cache) {
      return cache.addAll(CORE_ASSETS);
    }).then(function () {
      /* خزّن الخطوط في ذاكرة مستقلة حتى لا تتأثر بمسح ذاكرة النواة */
      return caches.open(FONT_CACHE).then(function (fontCache) {
        return fontCache.addAll(FONT_ASSETS);
      });
    }).then(function () {
      return self.skipWaiting();
    }).catch(function () {})
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key.indexOf('sawamet-') === 0 && key.indexOf(CACHE_VERSION) === -1;
          })
          .map(function (key) {
            return caches.delete(key);
          })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url = new URL(request.url);
  if (url.origin !== location.origin) return;

  /* الشعار والأيقونات والصور: قراءة من التخزين أولاً (بدون إعادة تحميل) */
  if (/\.(png|jpe?g|gif|svg|webp|ico|avif|bmp)(\?.*)?$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        if (cached) return cached;
        return fetch(request).then(function (response) {
          if (response && (response.status === 200 || response.type === 'opaque')) {
            var clone = response.clone();
            caches.open(IMAGE_CACHE).then(function (cache) {
              cache.put(request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  /* الخطوط: قراءة من التخزين أولاً (بدون أي طلب شبكة) */
  if (/\.(otf|woff2?|ttf|eot)(\?.*)?$/.test(url.pathname)) {
    event.respondWith(
      caches.open(FONT_CACHE).then(function (fontCache) {
        return fontCache.match(request).then(function (cached) {
          if (cached) return cached;
          return fetch(request).then(function (response) {
            if (response && (response.status === 200 || response.type === 'opaque')) {
              fontCache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  /* ملفات التشغيل الأساسية: استخدم النسخة المخزنة فوراً ثم حدّثها في الخلفية
     (ملف sw.js نفسه مستثنى ليصل من الشبكة دائماً) */
  if (/\/(css\/.*\.css|script\.js|menu\.js)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        var network = fetch(request).then(function (response) {
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CORE_CACHE).then(function (cache) {
              cache.put(request, clone);
            });
          }
          return response;
        }).catch(function () {
          return cached;
        });
        return cached || network;
      })
    );
    return;
  }

  /* الصفحات: تحميل الأحدث أولاً مع الرجوع للنسخة المخزنة عند انقطاع الاتصال */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(function (response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CORE_CACHE).then(function (cache) {
            cache.put(request, clone);
          });
        }
        return response;
      }).catch(function () {
        return caches.match(request).then(function (cached) {
          if (cached) return cached;
          return caches.match('./');
        });
      })
    );
  }
});