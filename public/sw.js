// import {registerRoute} from 'workbox-routing';
// import {CacheFirst} from 'workbox-strategies';
// import {CacheableResponsePlugin} from 'workbox-cacheable-response';

const dbName = 'myDB';
const version = 2;
const request = indexedDB.open(dbName, version);

request.onerror = event => {
  console.error('IndexedDB error: ', event);
};

// This is called the first time a database is used
// and again each time the version number changes.
request.onupgradeneeded = event => {
  const db = request.result;
  const store = db.createObjectStore('dogs', {keyPath: 'id'});
  // Include multiple property names in the
  // 2nd parameter array for a compound index.
  store.createIndex('breed', ['breed'], {unique: false});
};

request.onsuccess = () => {
  const db = request.result;
  const txn = db.transaction('dogs', 'readwrite');
  const store = txn.objectStore('dogs');
  const breedIndex = store.index('breed');

  store.put({id: 1, name: 'Comet', age: 3, breed: 'Whippet'});
  store.put({
    id: 2,
    name: 'Oscar',
    age: 5,
    breed: 'German Shorthaired Pointer'
  });
  store.put({id: 3, name: 'Clarice', age: 1, breed: 'Whippet'});

  const idQuery = store.get(2); // gets by id
  idQuery.onsuccess = () => {
    console.log('sw.js: dog =', idQuery.result);
  };
  idQuery.onerror = () => {
    console.error('sw.js: error getting dog with id 2');
  };

  // Must pass an array of values to getAll, not a single value.
  const breedQuery = breedIndex.getAll(['Whippet']); // gets by breed
  breedQuery.onsuccess = () => {
    console.log('sw.js: dogs =', breedQuery.result);
  };

  // To get only the first match, call "get" instead of "getAll".
  // Pass an array of values to match a compound index.

  txn.oncomplete = () => {
    db.close();
  };

  // TODO: When should you call txn.commit() or txn.abort() to rollback?

  // TODO: Show how to update and delete objects in an IndexedDB store.
};

request.onversionchange = () => {
  console.log('sw.js onversionchange: entered');
};

/*
const pageStrategy = new CacheFirst({
  // Put all cached files in a cache named 'pages'
  cacheName: 'pages',
  plugins: [
    // Only requests that return with a 200 status are cached
    new CacheableResponsePlugin({
      statuses: [200]
    })
  ]
});

// Cache page navigations (HTML) with a Cache First strategy
registerRoute(({request}) => request.mode === 'navigate', pageStrategy);
*/
