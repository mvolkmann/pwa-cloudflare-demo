let db;

async function setup() {
  const estimate = await navigator.storage.estimate();
  console.log('setup.js: storage estimate =', estimate);

  try {
    db = await openDB();
    await clearDogs();
    await createDog('Comet', 'Whippet');
    await createDog('Oscar', 'German Shorthaired Pointer');
    const dogs = await getAllDogs();
    console.log('setup.js: dogs =', dogs);
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

function openDB() {
  const version = 1;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('myDB', version);

    request.onupgradeneeded = event => {
      const db = request.result;
      const storeName = 'dogs';
      const options = {autoIncrement: true, keyPath: 'id'};
      dogStore = db.createObjectStore(storeName, options);
      dogStore.createIndex('breed', ['breed'], {unique: false});
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
  const txn = db.transaction('dogs', 'readwrite');
  const store = txn.objectStore('dogs');
  const request = store.clear();
  return requestToPromise(request, 'clear store');
}

function createDog(name, breed) {
  const txn = db.transaction('dogs', 'readwrite');
  const store = txn.objectStore('dogs');
  const dog = {name, breed};
  const request = store.add(dog);
  return requestToPromise(request, 'create dog');
}

function getAllDogs(key) {
  const txn = db.transaction('dogs', 'readonly');
  const store = txn.objectStore('dogs');
  const request = store.getAll();
  return requestToPromise(request, 'get all dogs');
}

function getDog(key) {
  const txn = db.transaction('dogs', 'readonly');
  const store = txn.objectStore('dogs');
  const request = store.get(key);
  return requestToPromise(request, 'get dog');
}

function updateDog(newDog) {
  const txn = db.transaction('dogs', 'readwrite');
  const store = txn.objectStore('dogs');
  const request = store.put(newDog);
  return requestToPromise(request, 'update dog');
}

function deleteDog(key) {
  const txn = db.transaction('dogs', 'readwrite');
  const store = txn.objectStore('dogs');
  const request = store.delete(key);
  return requestToPromise(request, 'delete dog');
}
