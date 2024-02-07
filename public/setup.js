/**
 * This sends a push notification.
 * @param {string} title
 * @param {string} body
 * @param {string} icon
 */
function sendNotification(title, body, icon) {
  new Notification(title, {body, icon});
}

async function setupServiceWorker() {
  // All modern browsers support service workers.
  if (!('serviceWorker' in navigator)) {
    console.error('Your browser does not support service workers');
    return;
  }

  try {
    // Register the service worker.
    // If it is already registered, information about it will be returned.
    await navigator.serviceWorker.register('service-worker.js', {
      type: 'module'
    });
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

/**
 * This asks the user for permission to send push notifications
 * if they have not already granted or denied this.
 *
 * It is recommended to wait to ask for permission until the user has
 * entered the site is made aware of why they would receive notifications.
 * Perhaps provide a "Enable Notifications" button that calls this function
 * as is done in public/index.html.
 */
async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    // service-worker.js listens for this message.
    navigator.serviceWorker.controller.postMessage('subscribe');
  } else {
    alert('Notifications are disabled.');
  }
  // Update the UI to reflect the new permission.
  location.reload();
}
