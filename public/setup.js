async function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.error('Your browser does not support service workers');
    return;
  }

  try {
    // Register the service worker.
    // TODO: If s already registered, does this return information about it?
    const reg = await navigator.serviceWorker.register('service-worker.js', {
      type: 'module'
    });

    // TODO: Why doesn't this work?
    // reg.showNotification('Can you see this?');

    // Get the existing subscription for push notifications.
    let subscription = reg.pushManager.getSubscription();
    if (!subscription) {
      // No subscription was found, so create one.
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

// Register to receive messages from the service worker.
// These are sent with "client.postMessage" in the service worker.
// They are not push notifications.
navigator.serviceWorker.onmessage = event => {
  const message = event.data;
  if (message === 'ready') {
    // Determine if a service worker is already controlling this page.
    const haveServiceWorker = Boolean(navigator.serviceWorker.controller);
    // If not then we must have just installed a new service worker.
    if (!haveServiceWorker) {
      // Give the new service worker time to really be ready.
      // Then reload the page so a GET to /dog will work.
      // This is needed to populate the table of dogs.
      setTimeout(() => {
        location.reload();
      }, 100);
    }
  }
};

// If the user has not already granted permission for notifications,
// this will ask for permission.
// It is recommended to wait to ask for permission until the user has
// entered the site is made aware of why they would receive notifications.
// Perhaps provide a "Enable Notifications" button that calls this function.

// The choice is remembered by the browser.
// The value will be "granted", "denied", or "default" (no choice made).

// To reset back to "default" in Chrome:
// - Click the circled "i" on the left end of the address bar.
// - Click the "Reset Permissions" button.

// To reset back to "default" in Safari:
// - Click "Safari" in the menu bar.
// - Click "Settings..." in the menu.
// - Click "Notifications" in the left nav of the dialog that appears.
// Scroll to the website domain in the main area of the dialog.
// Select it and click the "Remove" button.

async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    // This message will appear in a popup.
    new Notification('Notifications are enabled.');
  } else {
    alert('Notifications are disabled.');
  }
  // Update the UI to reflect the new permission.
  location.reload();
}
