async function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.error('Your browser does not support service workers');
    return;
  }

  try {
    const reg = await window.navigator.serviceWorker.register(
      'service-worker.js',
      {
        type: 'module'
      }
    );

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

/*
navigator.serviceWorker.ready.then(() => {
  console.log('setup.ts serviceWorker is ready');
});

const {serviceWorker} = navigator;
const haveServiceWorker = Boolean(serviceWorker.controller);
if (!haveServiceWorker) {
  navigator.serviceWorker.ready.then(() => {
    location.reload();
  });
}
*/

window.navigator.serviceWorker.onmessage = (event: any) => {
  // console.log('setup.js: message from service worker =', event.data);
  const haveServiceWorker = Boolean(window.navigator.serviceWorker.controller);
  if (!haveServiceWorker) {
    // Now that the service worker is installed,
    // reload the page so a GET to /dog will work.
    // The timeout gives the service worker time to really be ready.
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }
};
