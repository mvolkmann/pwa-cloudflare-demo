setupServiceWorker();

async function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.error('Your browser does not support service workers');
    return;
  }

  try {
    // TODO: It seems like the leading slash is not needed.
    const reg = await navigator.serviceWorker.register('/service-worker.js', {
      type: 'module'
    });
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

      // If the "dogs" store already exists, delete it.
      const txn = event.target.transaction;
      const names = Array.from(txn.objectStoreNames);
      if (names.includes(storeName)) deleteStore(storeName);

      const store = createStore(storeName, 'id', true);
      createIndex(store, 'breed-index', 'breed');
    };
  });
}
