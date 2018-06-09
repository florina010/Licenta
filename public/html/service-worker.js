
var cacheName = 'vv';
// Default files to always cache
var cacheFiles = [
	'../js/display.js',
	'../css/display.css',
	'./display.html'
]
const RUNTIME = 'runtime';
self.addEventListener('install', function (e) {
    console.log('[ServiceWorker] Installed');
    // e.waitUntil Delays the event until the Promise is resolved
    e.waitUntil(
        // Open the cache
        caches.open(cacheName).then(function (cache) {
            // Add all the default files to the cache
            console.log('[ServiceWorker] Caching cacheFiles');
            return cache.addAll(cacheFiles);
        })
    ); // end e.waitUntil
});


self.addEventListener('activate', function (e) {
    console.log('[ServiceWorker] Activated');
    e.waitUntil(
        // Get all the cache keys (cacheName)
        caches.keys().then(function (cacheNames) {
            return Promise.all(cacheNames.map(function (thisCacheName) {
                // If a cached item is saved under a previous cacheName
                if (thisCacheName !== cacheName) {
                    // Delete that cached file
                    console.log('[ServiceWorker] Removing Cached Files from Cache - ', thisCacheName);
                    return caches.delete(thisCacheName);
                }
            }));
        })
    ); // end e.waitUntil
});

// self.addEventListener('fetch', function(event) {
//     event.respondWith(
//         // Try the network
//         fetch(event.request).then(function(res) {
//                 return caches.open(cacheName).then(function(cache) {
//                         // Put in cache if succeeds
//                         cache.put(event.request.url, res.clone());
//                         return res;
//                     })
//             })
//             .catch(function(err) {
//                 // Fallback to cache
//                 return caches.match(event.request);
//             })
//     );
// });


self.addEventListener('fetch', function(event) {

  event.respondWith(
    // Opens Cache objects that start with 'font'.
    caches.open('vv').then(function(cache) {
      return cache.match(event.request).then(function(response) {
        if (response) {
          return response;
        }

        return fetch(event.request).then(function(networkResponse) {
					if (event.request.method === 'GET') {
						cache.put(event.request, networkResponse.clone());
					}

          return networkResponse;
        });
      }).catch(function(error) {

        // Handles exceptions that arise from match() or fetch().
         return caches.match(event.request);

        throw error;
      });
    })
  );
});
