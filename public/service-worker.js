import IDBEasy from './idb-easy.js';

let idbEasy;

// Should this use the Workbox library?
const cacheName = 'pwa-demo-v1';

async function deleteCache(cacheName) {
  const keys = await caches.keys();
  return Promise.all(
    keys.map(key => (key === cacheName ? null : caches.delete(key)))
  );
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

async function addSnoopy() {
  const dog = {name: 'Snoopy', breed: 'Beagle'};
  dog.id = await idbEasy.createRecord('dogs', dog);
  const html = dogToTableRow(dog);
  return new Response(html, {
    headers: {'Content-Type': 'application/html'}
  });
}

async function deleteSnoopy() {
  await idbEasy.deleteRecordsByIndex('dogs', 'name-index', 'Snoopy');
  return getDogs();
}

function dogToTableRow(dog) {
  const {breed, id, name} = dog;
  return `<tr><td>${id}</td><td>${name}</td><td>${breed}</td></tr>`;
}

async function getDogs() {
  const dogs = await idbEasy.getAllRecords('dogs');
  const html = dogs.map(dogToTableRow).join('');
  return new Response(html, {
    headers: {'Content-Type': 'application/html'}
  });
}

async function updateSnoopy() {
  await idbEasy.updateRecordsByIndex(
    'dogs',
    'name-index',
    'Snoopy',
    'Woodstock'
  );
  return getDogs();
}

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
      event.respondWith(getDogs());
    } else if (method === 'POST') {
      //TODO: How can you get the request body?
      event.respondWith(addSnoopy());
    } else if (method === 'PUT') {
      event.respondWith(updateSnoopy());
    } else if (method === 'DELETE') {
      event.respondWith(deleteSnoopy());
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
    idbEasy = new IDBEasy(db);
    // await clearStore(storeName);

    const count = await idbEasy.getRecordCount(storeName);
    if (count === 0) {
      // Unless the database is deleted and recreated,
      // these records will be recreated with new key values.
      await idbEasy.createRecord(storeName, {name: 'Comet', breed: 'Whippet'});
      await idbEasy.createRecord(storeName, {
        name: 'Oscar',
        breed: 'German Shorthaired Pointer'
      });

      const dogs = await getAllRecords(storeName);

      const comet = dogs.find(dog => dog.name === 'Comet');
      if (comet) {
        comet.name = 'Fireball';
        await idbEasy.upsertRecord(storeName, comet);
      }

      await idbEasy.upsertRecord(storeName, {
        name: 'Clarice',
        breed: 'Whippet'
      });
    }

    /*
    const oscar = await getRecordByKey(storeName, 2);
    console.log('oscar =', oscar);

    const whippets = await getRecordsByIndex(
      storeName,
      'breed-index',
      'Whippet'
    );
    console.log('whippets =', whippets);

    await deleteRecordByKey(storeName, 2);
    const remainingDogs = await getAllRecords('dogs');
    console.log('remainingDogs =', remainingDogs);
    */
  } catch (error) {
    console.error('setup.js: failed to open db:', error);
  }
}

//-----------------------------------------------------------------------------

function openDB(storeName) {
  const version = 1;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('myDB', version);

    request.onsuccess = event => {
      const db = request.result;
      resolve(db);
    };

    request.onerror = event => {
      console.error('failed to open database');
      reject(event);
    };

    request.onupgradeneeded = event => {
      const {newVersion, oldVersion} = event;
      if (oldVersion === 0) {
        console.log('creating first version');
      } else {
        console.log('upgrading from version', oldVersion, 'to', newVersion);
      }

      db = request.result;

      // If the "dogs" store already exists, delete it.
      const txn = event.target.transaction;
      const names = Array.from(txn.objectStoreNames);
      if (names.includes(storeName)) deleteStore(storeName);

      const store = idbEasy.createStore(storeName, 'id', true);
      idbEasy.createIndex(store, 'breed-index', 'breed');
      idbEasy.createIndex(store, 'name-index', 'name');
    };
  });
}
