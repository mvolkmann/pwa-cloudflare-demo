let db;
const dbName = 'myDB';
const storeName = 'dogs';

async function setup() {
  const estimate = await navigator.storage.estimate();
  console.log('setup.js: storage estimate =', estimate);

  try {
    await deleteDB();
    db = await openDB();
    await clearDogs();
    // Unless the database is deleted and recreated,
    // these records will be recreated with new key values.
    await createDog('Comet', 'Whippet');
    await createDog('Oscar', 'German Shorthaired Pointer');
    const dogs = await getAllDogs();
    console.log('dogs =', dogs);
    const oscar = await getDogByKey(2);
    console.log('oscar =', oscar);
    const whippets = await getDogsByBreed('Whippet');
    console.log('whippets =', whippets);
    await deleteDog(2);
    const remainingDogs = await getAllDogs();
    console.log('remainingDogs =', remainingDogs);
  } catch (error) {
    console.error('setup.js: failed to open db:', error);
  }

  /*
  if ('serviceWorker' in navigator) {
    try {
      // const reg = await navigator.serviceWorker.register('service-worker.js');
      const reg = await navigator.serviceWorker.register('sw.js');
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
  */
}

setup();

function requestToPromise(request, action) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      console.log('succeeded to', action);
      resolve(request.result);
    };
    request.onerror = event => {
      console.error('failed to', action);
      reject(event);
    };
  });
}

function deleteDB() {
  const request = indexedDB.deleteDatabase(dbName);
  return requestToPromise(request, 'delete database');
}

function openDB() {
  const version = 1;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onupgradeneeded = event => {
      console.log('onupgradeneeded: oldversion =', event.oldversion);
      console.log('onupgradeneeded: newversion =', event.newversion);
      const db = request.result;
      console.log('onupgradeneeded: db version =', db.version);
      const options = {autoIncrement: true, keyPath: 'id'};
      const store = db.createObjectStore(storeName, options);
      store.createIndex('breed-index', 'breed', {unique: false});
    };

    request.onsuccess = event => {
      const db = request.result;
      resolve(db);
    };

    request.onerror = event => {
      console.error('failed to open database');
      reject(event);
    };
  });
}

function createStore() {}

function clearDogs() {
  const txn = db.transaction(storeName, 'readwrite');
  const store = txn.objectStore(storeName);
  const request = store.clear();
  return requestToPromise(request, 'clear store');
}

function createDog(name, breed) {
  const txn = db.transaction(storeName, 'readwrite');
  const store = txn.objectStore(storeName);
  const dog = {name, breed};
  const request = store.add(dog);
  return requestToPromise(request, 'create dog');
}

function getAllDogs(key) {
  const txn = db.transaction(storeName, 'readonly');
  const store = txn.objectStore(storeName);
  const request = store.getAll();
  return requestToPromise(request, 'get all dogs');
}

function getDogByKey(key) {
  const txn = db.transaction(storeName, 'readonly');
  const store = txn.objectStore(storeName);
  const request = store.get(key);
  return requestToPromise(request, 'get dog');
}

function getDogsByBreed(breed) {
  const txn = db.transaction(storeName, 'readonly');
  const store = txn.objectStore(storeName);
  const index = store.index('breed-index');
  const request = index.getAll(breed);
  // const range = IDBKeyRange.only(breed);
  // const request = index.getAll(range);
  return requestToPromise(request, 'get dogs by breed');
}

function updateDog(newDog) {
  const txn = db.transaction(storeName, 'readwrite');
  const store = txn.objectStore(storeName);
  const request = store.put(newDog);
  return requestToPromise(request, 'update dog');
}

function deleteDog(key) {
  const txn = db.transaction(storeName, 'readwrite');
  const store = txn.objectStore(storeName);
  const request = store.delete(key);
  return requestToPromise(request, 'delete dog');
}
