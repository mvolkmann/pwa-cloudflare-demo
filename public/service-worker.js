import {Router} from './tiny-request-router.mjs';
import Dogs from './dogs.js';
import IDBEasy from './idb-easy.js';

// We aren't currently caching .css files because we want
// changes to be reflected without clearing the cache.
const fileExtensionsToCache = ['jpg', 'js', 'json', 'png', 'webp'];

let dogs;

const router = new Router();
router.get('/hello', () => new Response('Hello from service worker!'));
router.get('/dog', () => dogs?.getDogs());
router.post('/dog', addDog);
router.put('/dog', () => dogs?.updateSnoopy());
router.delete('/dog/:id', params => {
  const id = Number(params.id);
  return dogs?.deleteDog(id);
});

const cacheName = 'pwa-demo-v1';

async function addDog(params, request) {
  const formData = await request.formData();
  const dog = Object.fromEntries(formData);
  return dogs?.addDog(dog);
}

async function deleteCache(cacheName) {
  const keys = await caches.keys();
  return Promise.all(
    keys.map(key => (key === cacheName ? null : caches.delete(key)))
  );
}

async function getBodyText(request) {
  const reader = request.body.getReader();
  let body = '';
  while (true) {
    const {done, value} = await reader.read();
    const text = new TextDecoder().decode(value);
    body += text;
    if (done) break;
  }
  return body;
}

async function getResource(request) {
  const log = false;
  const url = new URL(request.url);
  const {href, pathname} = url;

  // Attempt to get from cache.
  let resource = await caches.match(request);
  if (resource) {
    if (log) console.log('service worker got', href, 'from cache');
  } else {
    try {
      // Get from network.
      resource = await fetch(request);
      if (log) console.log('service worker got', href, 'from network');

      const index = pathname.lastIndexOf('.');
      const extension = index === -1 ? '' : pathname.substring(index + 1);
      if (fileExtensionsToCache.includes(extension)) {
        // Save in cache for when we are offline later.
        const cache = await caches.open(cacheName);
        await cache.add(url);
        if (log) console.log('service worker cached', href);
      }
    } catch (e) {
      console.error('service worker failed to fetch', url);
      resource = new Response('', {status: 404});
    }
  }

  return resource;
}

self.addEventListener('install', event => {
  console.log('service-worker.js: installing');
  // This causes a newly installed service worker to
  // progress to the activating state, regardless of
  // whether there is already an active service worker.
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('service-worker.js: activating');
  // event.waitUntil(deleteCache(cacheName));
});

// No fetch events are generated in the initial load of the web app.
// A second visit is required to cache all the resources.
self.addEventListener('fetch', async event => {
  const {request} = event;
  const url = new URL(request.url);
  const {pathname} = url;

  const match = router.match(request.method, pathname);
  const promise = match
    ? match.handler(match.params, request)
    : getResource(request);
  event.respondWith(promise);
});

//-----------------------------------------------------------------------------

setupDatabase();

async function setupDatabase() {
  // Safari says "The operation is not supported."
  // const estimate = await navigator.storage.estimate();
  // console.log('setup.js: storage estimate =', estimate);

  const dbName = 'myDB';
  const version = 1;

  try {
    await IDBEasy.openDB(dbName, version, (db, event) => {
      dogs = new Dogs(new IDBEasy(db));
      dogs.upgrade(event);
      // Wait for upgrade transaction to complete.
      setTimeout(() => {
        dogs.initialize();
      }, 100);
    });
    // await clearStore(storeName);
  } catch (error) {
    console.error('setup.js: failed to open database:', error);
  }
}
