async function setup() {
  if ('serviceWorker' in navigator) {
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
}

setup();
