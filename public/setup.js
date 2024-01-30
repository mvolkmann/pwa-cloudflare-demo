async function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.error('Your browser does not support service workers');
    return;
  }

  try {
    const reg = await navigator.serviceWorker.register('service-worker.js', {
      type: 'module'
    });
    console.log('service worker registered with scope', reg.scope);

    // TODO: Should you care about these state changes?
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

setupServiceWorker();

// index.html sends a "GET /dog" request
// before the service worker is registered.
// This reloads the page after the service worker is registered
// so the request can be resent.
navigator.serviceWorker.ready.then(reg => {
  location.reload();
});
