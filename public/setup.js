async function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.error('Your browser does not support service workers');
    return;
  }

  try {
    const reg = await navigator.serviceWorker.register('service-worker.js', {
      type: 'module'
    });

    /*
    // TODO: Should you care about these state changes?
    reg.onupdatefound = () => {
      const newSW = reg.installing;
      newSW.addEventListener('statechange', event => {
        switch (newSW.state) {
          case 'installed':
            if (navigator.serviceWorker.controller) {
              console.log('setup.js: update is available');
            } else {
              console.log('setup.js: content is cached for offline use');
            }
            break;
          case 'redundant':
            console.error(
              'setup.js: installing service worker became redundant'
            );
            break;
        }
      });
    };
    */
  } catch (error) {
    console.error('setup.js setupServiceWorker registered failed:', error);
  }
}

setupServiceWorker();

navigator.serviceWorker.onmessage = event => {
  console.log('setup.js: message from service worker =', event.data);
  window.dispatchEvent(new Event('sw-ready'));
};
