import Dogs from './dogs.js';
import IDBEasy from './idb-easy.js';

// Should this use the Workbox library?
const cacheName = 'pwa-demo-v1';

let dogs;

async function addDog(request) {
  const formData = await request.formData();
  const dog = Object.fromEntries(formData);
  return dogs.addDog(dog);
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

self.addEventListener('install', event => {
  // This causes a newly installed service worker to
  // progress to the activating state, regardless of
  // whether there is already an active service worker.
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(deleteCache(cacheName));
});

// No fetch events are generated in the initial load of the web app.
// A second visit is required to cache all the resources.
self.addEventListener('fetch', async event => {
  const {request} = event;

  const {method} = request;
  const url = new URL(request.url);
  if (url.pathname.startsWith('/dog')) {
    console.log('service-worker.js fetch: got dog request');
    console.log('service-worker.js fetch: method =', method);
    if (method === 'GET') {
      event.respondWith(dogs.getDogs());
    } else if (method === 'POST') {
      event.respondWith(addDog(request));
    } else if (method === 'PUT') {
      event.respondWith(dogs.updateSnoopy());
    } else if (method === 'DELETE') {
      event.respondWith(dogs.deleteSnoopy());
    }
    return;
  }

  const getResource = async () => {
    const {url} = request;
    let resource;

    /*
    // Get from cache.
    resource = await caches.match(request);
    if (resource) {
      // console.log('service worker got', url, 'from cache');
    } else {
    */
    try {
      // Get from network.
      resource = await fetch(request);
      console.log('service worker got', url, 'from network');

      // Save in cache for when we are offline later.
      // const cache = await caches.open(cacheName);
      // await cache.add(url);
      // console.log('service worker cached', url);
    } catch (e) {
      console.error('service worker failed to get', url);
      resource = new Response('', {status: 404});
    }
    // }

    return resource;
  };

  event.respondWith(getResource());
});

//-----------------------------------------------------------------------------

let db;

setupDatabase();

async function setupDatabase() {
  const estimate = await navigator.storage.estimate();
  console.log('setup.js: storage estimate =', estimate);

  const storeName = 'dogs';

  try {
    db = await openDB(storeName);
    // await clearStore(storeName);
  } catch (error) {
    console.error('setup.js: failed to open db:', error);
  }
}

//-----------------------------------------------------------------------------

function openDB(storeName) {
  console.log('service-worker.js openDB: entered');
  const version = 1;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('myDB', version);

    request.onsuccess = async event => {
      const db = request.result;
      dogs = new Dogs(new IDBEasy(db));
      resolve(db);
    };

    request.onerror = event => {
      console.error('failed to open database');
      reject(event);
    };

    request.onupgradeneeded = async event => {
      const db = request.result;
      dogs = new Dogs(new IDBEasy(db));
      dogs.upgrade(event);
      // Wait for upgrade transaction to complete.
      setTimeout(() => {
        dogs.initialize();
      }, 100);
    };
  });
}
