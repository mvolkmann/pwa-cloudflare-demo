import {Router} from './tiny-request-router.mjs';
import Dogs from './dogs.js';
import IDBEasy from './idb-easy.js';

const dbName = 'myDB';
const version = 1;

// We aren't currently caching .css files because we want
// changes to be reflected without clearing the cache.
const fileExtensionsToCache = ['jpg', 'js', 'json', 'png', 'webp'];

//-----------------------------------------------------------------------------
// Define routes that this service worker will handle.

async function getDogs() {
  const db = await IDBEasy.openDB(dbName, version);
  return new Dogs(new IDBEasy(db));
}

const router = new Router();

router.get('/hello', () => new Response('Hello from service worker!'));

router.get('/dog', async () => {
  const dogs = await getDogs();
  return dogs.getDogs();
});

router.post('/dog', async (params, request) => {
  const formData = await request.formData();
  const dog = Object.fromEntries(formData);
  const dogs = await getDogs();
  return dogs.addDog(dog);
});

router.put('/dog', async () => {
  const dogs = await getDogs();
  return dogs.updateSnoopy();
});

router.delete('/dog/:id', async params => {
  const dogs = await getDogs();
  return dogs.deleteDog(Number(params.id));
});

//-----------------------------------------------------------------------------

const cacheName = 'pwa-demo-v1';

// This is not currently used.
async function deleteCache(cacheName) {
  const keys = await caches.keys();
  return Promise.all(
    keys.map(key => (key === cacheName ? null : caches.delete(key)))
  );
}

// This is not currently used.
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
      if (shouldCache(pathname)) {
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

function shouldCache(pathName) {
  if (pathName.endsWith('setup.js')) return false;
  if (pathName.endsWith('service-worker.js')) return false;
  const extension = index === -1 ? '' : pathname.substring(index + 1);
  return fileExtensionsToCache.includes(extension);
}

self.addEventListener('install', event => {
  console.log('service-worker.js: installing');
  // This causes a newly installed service worker to
  // progress to the activating state, regardless of
  // whether there is already an active service worker.
  self.skipWaiting();
});

self.addEventListener('activate', async event => {
  console.log('service-worker.js: activating');
  // event.waitUntil(deleteCache(cacheName));

  // Safari says "The operation is not supported." for the "estimate" method.
  // const estimate = await navigator.storage.estimate();
  // console.log('setup.js: storage estimate =', estimate);

  try {
    await IDBEasy.openDB(dbName, version, (db, event) => {
      const dogs = new Dogs(new IDBEasy(db));
      return dogs.upgrade(event);
    });

    // Let browser clients know that the service worker is ready.
    const clients = await self.clients.matchAll({includeUncontrolled: true});
    for (const client of clients) {
      client.postMessage('service worker ready');
    }
  } catch (error) {
    console.error('setup.js: failed to open database:', error);
  }
});

self.addEventListener('fetch', async event => {
  const {request} = event;
  const url = new URL(request.url);
  const {pathname} = url;

  const log = request.method === 'GET' && pathname === '/dog';
  const match = router.match(request.method, pathname);
  if (log) console.log('match for GET /dog =', match);
  const promise = match
    ? match.handler(match.params, request)
    : getResource(request);
  event.respondWith(promise);
});
