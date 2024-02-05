async function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.error('Your browser does not support service workers');
    return;
  }

  try {
    const reg = await navigator.serviceWorker.register('service-worker.js', {
      type: 'module'
    });

    let subscription = reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = reg.pushManager.subscribe({
        applicationServerKey: '?',
        userVisibleOnly: true
      });
      console.log('setup.js: subscription =', subscription);
      const info = {
        endpoint: '?',
        // This is the server public key.
        // When the server sends a push notification,
        // it must encrypt it with this public key.
        keys: {
          auth: '?',
          p256dh: '?'
        }
      };
      const response = await fetch('/push-subscribe', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(info)
      });
      const data = await response.json();
      console.log('setup.js: data =', data);
    }

    // To revoke this permission in Chrome:
    // TODO: I'm not sure this is correct.
    // - click the ellipsis menu button in the upper-right
    // - click "Settings"
    // - click "Privacy and security"
    // - click "Site settings"
    // - click "Notifications"
    // - click "http://localhost:8787"
    // - under "Permissions", change the value for "Notifications"
    //   from "Allow" to "Ask (default)"
    Notification.requestPermission(result => {
      console.log('permission result =', result);
      if (result === 'granted') {
        console.log('Notification permission was granted.');
        // configurePushSub(); // Write your custom function that pushes your message
      } else {
        console.log('Notification permission was not granted.');
      }
    });

    // TO TEST THIS:
    // - open Chrome DevTools
    // - click the "Application" tab
    // - click "Service Workers"
    // - enter text for a push message
    // - click the "Push" button
    // - a browser popup should appear

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

navigator.serviceWorker.onmessage = () => {
  // console.log('setup.js: message from service worker =', event.data);
  const haveServiceWorker = Boolean(navigator.serviceWorker.controller);
  if (!haveServiceWorker) {
    // Now that the service worker is installed,
    // reload the page so a GET to /dog will work.
    // The timeout gives the service worker time to really be ready.
    setTimeout(() => {
      location.reload();
    }, 100);
  }
};
