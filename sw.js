// the cache version gets updated every time there is a new deployment
const CACHE_VERSION = 10;
const CURRENT_CACHE = `main-${CACHE_VERSION}`;

// these are the routes we are going to cache for offline support
const cacheFiles = ['/', '/about/', '/offline/'];
const OFFLINE_URL = ['/offline/']
// on activation we clean up the previously registered service workers
self.addEventListener('activate', evt =>
    evt.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CURRENT_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    )
);

// on install we download the routes we want to cache for offline
self.addEventListener('install', evt =>
    evt.waitUntil(
        caches.open(CURRENT_CACHE).then(cache => {
            return cache.addAll(cacheFiles);
        })
    )
);

// fetch the resource from the network
const fromNetwork = (request, timeout) =>
    new Promise((fulfill, reject) => {
        const timeoutId = setTimeout(reject, timeout);
        fetch(request).then(response => {
            clearTimeout(timeoutId);
            fulfill(response);
            update(request);
        }, reject);
    });

// fetch the resource from the browser cache
const fromCache = request =>
    caches
        .open(CURRENT_CACHE)
        .then(cache =>
            cache
                .match(request)
                .then(matching => matching || cache.match(OFFLINE_URL))
        );

// cache the current page to make it available for offline
const update = request =>
    caches
        .open(CURRENT_CACHE)
        .then(cache =>
            fetch(request).then(response => cache.put(request, response))
        );

// general strategy when making a request (eg if online try to fetch it
// from the network with a timeout, if something fails serve from cache)
self.addEventListener('fetch', evt => {
    // Skip cross-origin requests, like those for Google Analytics.
    // Skip all ghost admin requests to prevent 500 errors
    if (evt.request.url.startsWith(self.location.origin) && !(evt.request.url.startsWith(`${self.location.origin}/ghost}`))) {
        evt.respondWith(
            fromNetwork(evt.request, 10000).catch(() => fromCache(evt.request))
        );
        evt.waitUntil(update(evt.request));

        // evt.respondWith(
        //     caches.match(evt.request).then(cachedResponse => {
        //         return caches.open(CURRENT_CACHE).then(cache => {
        //             return fetch(evt.request).then(response => {
        //                 // Put a copy of the response in the runtime cache.
        //                 return cache.put(evt.request, response.clone()).then(() => {
        //                     return response;
        //                 });
        //             }).catch(error => {
        //                 // Return cached reponse if network fails
        //                 if (cachedResponse) {
        //                     return cachedResponse;
        //                 } else {
        //                     // Return offline page if network and cache both fail
        //                     return caches.match(OFFLINE_URL);
        //                 }
        //             });;
        //         });
        //     })
        // );
    };

});

