//TODO: Which of these lines are really required?
/// <reference no-default-lib="true"/>
/// <reference lib="ES2016" />
/// <reference lib="webworker" />

import DogController from './dog-controller.js';
import {getRouter} from './dog-router.js';
import IDBEasy from './idb-easy.js';

const cacheName = 'pwa-demo-v1';
const dbName = 'myDB';
const version = 1;

// This value was copied from the .env file.
const publicKey =
  'BMx9QagkN_EidkH7D8jdZaz5BM2Hh-d3RQ5W1iWOfh32KRdbxu7fATv5ozLPUfQasRIZo7JQ6ULGVKgfUX3HO7A';

// We aren't currently caching .css files and certain .js files
// because we want changes to be reflected without clearing the cache.
const fileExtensionsToCache = ['jpg', 'js', 'json', 'png', 'webp'];

/**
 * @typedef {object} RouterMatch
 * @property {string} method;
 * @property {string} path;
 * @property {() => Response} handler;
 */

/**
 * This is a Router for dog API endpoints.
 * @type {{match: (method: string, pathname: string) => RouterMatch }}
 */
let dogRouter;

setDogRouter();

//-----------------------------------------------------------------------------

/**
 * This converts a base64 string to a Uint8Array.
 * TODO: Is there an easier way to do this?
 * @param {string} base64String
 * @returns a Uint8Array
 */
function base64StringToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * This deletes all the keys from a given cache.
 * It is not currently used.
 * @param {string} cacheName
 * @returns {Promise<void>}
 */
async function deleteCache(cacheName) {
  // @type {string[]}
  const keys = await caches.keys();
  await Promise.all(
    keys.map(key => (key === cacheName ? null : caches.delete(key)))
  );
}

/**
 * This gets the body of a request as text.
 * It is not currently used.
 * @param {Request} request
 * @returns {Promise<string>} the body text
 */
async function getBodyText(request) {
  const {body} = request;
  if (!body) return '';
  const reader = body.getReader();
  let result = '';
  while (true) {
    const {done, value} = await reader.read();
    const text = new TextDecoder().decode(value);
    result += text;
    if (done) break;
  }
  return result;
}

/**
 * This attempts to get a resource from the cache.
 * If it is not found in the cache, it is retrieved from the network.
 * If it is a kind of resource we want to cache, it is added to the cache.
 * @param {Request} request
 * @returns {Promise<Response>} that contains the resource
 */
async function getResource(request) {
  const log = false; // set to true for debugging
  const url = new URL(request.url);
  const {href, pathname} = url;

  // Attempt to get the resource from the cache.
  /** @type {Response | undefined} */
  let resource = await caches.match(request);

  if (resource) {
    if (log) console.log('service worker got', href, 'from cache');
  } else {
    try {
      // Get the resource from the network.
      resource = await fetch(request);
      if (log) console.log('service worker got', href, 'from network');

      if (shouldCache(pathname)) {
        // Save in the cache to avoid unnecessary future network requests
        // and supports offline use.
        const cache = await caches.open(cacheName);
        await cache.add(url);
        if (log) console.log('service worker cached', href);
      }
    } catch (error) {
      console.error('service-worker.js getResource:', error);
      console.error('service worker failed to fetch', url);
      resource = new Response('', {status: 404});
    }
  }

  return resource;
}

/**
 * This saves a push notification subscription on the server
 * so the server can send push notifications to this client.
 * @param {Subscription} subscription
 */
async function saveSubscription(subscription) {
  try {
    await fetch('/save-subscription', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(subscription)
    });
  } catch (error) {
    console.error('service-worker.js saveSubscription:', error);
  }
}

/**
 * This sets the dogRouter variable to a Router
 * that is used to handle API requests for dogs.
 * I tried for a couple of hours to simplify this code
 * and couldn't arrive at an alternative that works.
 */
function setDogRouter() {
  const promise = IDBEasy.openDB(dbName, version, (db, event) => {
    const dogController = new DogController(new IDBEasy(db));
    dogController.upgrade(event);
  });

  // Top-level await is not allowed in service workers.
  promise.then(upgradedDB => {
    const dogController = new DogController(new IDBEasy(upgradedDB));
    dogRouter = getRouter(dogController);
  });
}

/**
 * This determines whether the file at a given path should be cached
 * based on its file extension.
 * @param {string} pathname
 * @returns {boolean} true to cache; false otherwise
 */
function shouldCache(pathname) {
  if (pathname.endsWith('setup.js')) return false;
  if (pathname.endsWith('service-worker.js')) return false;
  const index = pathname.lastIndexOf('.');
  const extension = index === -1 ? '' : pathname.substring(index + 1);
  return fileExtensionsToCache.includes(extension);
}

//-----------------------------------------------------------------------------

/**
 * This registers a listener for the "install" event of this service worker.
 */
self.addEventListener('install', event => {
  console.log('service-worker.js: installing');
  // It allows existing browser tabs to use an
  // updated version of this service worker.
  self.skipWaiting();
});

/**
 * @typedef {object} SubscriptionKeys
 * @property auth {string}
 * @property p256dh {string}
 */

/**
 * @typedef {object} Subscription
 * @property endpoint {string}
 * @property expirationTime {number | null}
 * @property keys {SubscriptionKeys}
 */

/**
 * This registers a listener for the "activate" event of this service worker.
 */
self.addEventListener('activate', async event => {
  console.log('service-worker.js: activating');

  // We could choose to delete the current cache every time
  // a new version of the service worker is activated.
  // event.waitUntil(deleteCache(cacheName));

  // This gets an estimate for the amount of storage available
  // to this service worker.
  // Safari says "The operation is not supported." for the "estimate" method.
  // const estimate = await navigator.storage.estimate();
  // console.log('service-worker.js: storage estimate =', estimate);

  // Subscribe to receive push notifications.
  const subscription = await self.registration.pushManager.subscribe({
    applicationServerKey: base64StringToUint8Array(publicKey),
    userVisibleOnly: true // false allows silent push notifications
  });
  // Save the subscription on the server.
  await saveSubscription(subscription);

  // Let browser clients know that the service worker is ready.
  try {
    const clients = await self.clients.matchAll({includeUncontrolled: true});
    for (const client of clients) {
      // setup.js listens for this message.
      client.postMessage('ready');
    }
  } catch (error) {
    console.error('service-worker.js failed to notify clients:', error);
  }
});

/**
 * This registers a listener for the "fetch" event of this service worker.
 * It responds with a resource for accessing data at a requested URL.
 */
self.addEventListener('fetch', async event => {
  const {request} = event;
  const url = new URL(request.url);
  const {pathname} = url;

  const match = dogRouter.match(request.method, pathname);
  const promise = match
    ? match.handler(match.params, request)
    : getResource(request);
  event.respondWith(promise);
});

/**
 * This registers a listener for the "push" event of this service worker.
 * One way to test this is to trigger a push from Chrome DevTools.
 * Click the "Application" tab, click "Service workers" in the left nav,
 * enter a message in the Push input, and click the "Push" button.
 */
self.addEventListener('push', async event => {
  console.log('service-worker.js push: event =', event);
  const text = event.data.text();
  // event.waitUntil(self.registration.showNotification('My Title', {body: text}));
  self.registration.showNotification('My Title', {body: text});
});
