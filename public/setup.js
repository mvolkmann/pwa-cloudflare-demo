let db;

// setupDatabase();
setupServiceWorker();

async function setupDatabase() {
  const estimate = await navigator.storage.estimate();
  console.log('setup.js: storage estimate =', estimate);

  const storeName = 'dogs';

  try {
    db = await openDB(storeName);
    await clearStore(storeName);

    // Unless the database is deleted and recreated,
    // these records will be recreated with new key values.
    await createRecord(storeName, {name: 'Comet', breed: 'Whippet'});
    await createRecord(storeName, {
      name: 'Oscar',
      breed: 'German Shorthaired Pointer'
    });

    const dogs = await getAllRecords(storeName);
    console.log('dogs =', dogs);

    const comet = dogs.find(dog => dog.name === 'Comet');
    if (comet) {
      comet.name = 'Fireball';
      await upsertRecord(storeName, comet);
    }

    await upsertRecord(storeName, {name: 'Clarice', breed: 'Whippet'});

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
  } catch (error) {
    console.error('setup.js: failed to open db:', error);
  }
}

async function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.error('Your browser does not support service workers');
    return;
  }

  try {
    const reg = await navigator.serviceWorker.register('service-worker.js');
    console.log('service worker registered with scope', reg.scope);

    reg.onupdatefound = () => {
      const newSW = reg.installing;
      newSW.addEventListener('statechange', event => {
        switch (newSW.state) {
          case 'installed':
            if (navigator.serviceWorker.controller) {
              console.log('update is available.');
            } else {
              console.log('content is cached for offline use');
            }
            break;
          case 'redundant':
            console.error('installing service worker became redundant');
            break;
        }
      });
    };
  } catch (error) {
    console.error('service worker registered failed:', error);
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

      const store = createStore(storeName, 'id', true);
      createIndex(store, 'breed-index', 'breed');
    };
  });
}

//-----------------------------------------------------------------------------

function clearStore(storeName) {
  const txn = db.transaction(storeName, 'readwrite');
  const store = txn.objectStore(storeName);
  const request = store.clear();
  return requestToPromise(request, 'clear store');
}

function createIndex(store, indexName, keyPath, unique = false) {
  store.createIndex(indexName, keyPath, {unique});
}

function createStore(storeName, keyPath, autoIncrement = false) {
  return db.createObjectStore(storeName, {autoIncrement, keyPath});
}

function createRecord(storeName, object) {
  const txn = db.transaction(storeName, 'readwrite');
  const store = txn.objectStore(storeName);
  const request = store.add(object);
  return requestToPromise(request, 'create record');
}

function deleteDB(dbName) {
  const request = indexedDB.deleteDatabase(dbName);
  return requestToPromise(request, 'delete database');
}

function deleteRecordByKey(storeName, key) {
  const txn = db.transaction(storeName, 'readwrite');
  const store = txn.objectStore(storeName);
  const request = store.delete(key);
  return requestToPromise(request, 'delete dog');
}

function deleteStore(storeName) {
  db.deleteObjectStore(storeName);
}

function getAllRecords(storeName) {
  const txn = db.transaction(storeName, 'readonly');
  const store = txn.objectStore(storeName);
  const request = store.getAll();
  return requestToPromise(request, 'get all records');
}

function getRecordByKey(storeName, key) {
  const txn = db.transaction(storeName, 'readonly');
  const store = txn.objectStore(storeName);
  const request = store.get(key);
  return requestToPromise(request, 'get record by key');
}

function getRecordsByIndex(storeName, indexName, indexValue) {
  const txn = db.transaction(storeName, 'readonly');
  const store = txn.objectStore(storeName);
  const index = store.index(indexName);
  const request = index.getAll(indexValue);
  return requestToPromise(request, 'get records by index');
}

function requestToPromise(request, action) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      // console.log('succeeded to', action);
      resolve(request.result);
    };
    request.onerror = event => {
      console.error('failed to', action);
      reject(event);
    };
  });
}

function upsertRecord(storeName, object) {
  const txn = db.transaction(storeName, 'readwrite');
  const store = txn.objectStore(storeName);
  const request = store.put(object);
  return requestToPromise(request, 'update dog');
}
