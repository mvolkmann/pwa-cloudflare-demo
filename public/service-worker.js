// Should this use the Workbox library?
const cacheName = 'pwa-demo-v1';

self.addEventListener('activate', event => {
  const deleteOldCaches = async () => {
    const keyList = await caches.keys();
    return Promise.all(
      keyList.map(key => (key !== cacheName ? caches.delete(key) : null))
    );
  };
  event.waitUntil(deleteOldCaches());
});

// No fetch events are generated in the initial load of the web app.
// A second visit is required to cache all the resources.
self.addEventListener('fetch', event => {
  const {request} = event;

  const getResource = async () => {
    const {url} = request;
    let resource;

    // Get from cache.
    resource = await caches.match(request);
    if (resource) {
      console.log('service worker got', url, 'from cache');
    } else {
      try {
        // Get from network.
        resource = await fetch(request);
        console.log('service worker got', url, 'from network');

        // Save in cache for when we are offline later.
        const cache = await caches.open(cacheName);
        await cache.add(url);
        console.log('service worker cached', url);
      } catch (e) {
        console.error('service worker failed to get', url);
        resource = new Response('', {status: 404});
      }
    }

    return resource;
  };

  event.respondWith(getResource());
});
