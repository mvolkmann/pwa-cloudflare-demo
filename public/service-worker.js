/// <reference no-default-lib="true"/>
/// <reference lib="ES2016" />
/// <reference lib="webworker" />

import DogController from './dog-controller.js';
import {getRouter} from './dog-router.js';
import IDBEasy from './idb-easy.js';

const cacheName = 'pwa-demo-v1';
const dbName = 'myDB';
const version = 1;

// We aren't currently caching .css files and certain .js files
// because we want changes to be reflected without clearing the cache.
const fileExtensionsToCache = ['jpg', 'js', 'json', 'png', 'webp'];

/**
 * @type {{match: (method: string, pathname: string) => RouterMatch }}
 */
let dogRouter;

const promise = IDBEasy.openDB(dbName, version, (db, event) => {
  const dogController = new DogController(new IDBEasy(db));
  return dogController.upgrade(event);
});

promise.then(db => {
  const dogController = new DogController(new IDBEasy(db));
  dogRouter = getRouter(dogController);
});

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
 * @param {Request} request
 * @returns {Promise<string>} the body text
 */
// This is not currently used.
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
 * This gets a resource from the cache or the network.
 * @param {Request} request
 * @returns Response
 */
async function getResource(request) {
  const log = false;
  const url = new URL(request.url);
  const {href, pathname} = url;

  // Attempt to get from cache.
  /** @type {Response | undefined} */
  let resource = await caches.match(request);
  if (resource) {
    if (log) console.log('service worker got', href, 'from cache');
  } else {
    try {
      // Get from network.
      resource = await fetch(request);
      if (log) console.log('service worker got', href, 'from network');

      if (shouldCache(pathname)) {
        // Save in cache for when we are offline later.
        const cache = await caches.open(cacheName);
        await cache.add(url);
        if (log) console.log('service worker cached', href);
      }
    } catch (error) {
      console.error('service worker failed to fetch', url);
      console.log('service-worker.js getResource: error =', error);
      resource = new Response('', {status: 404});
    }
  }

  return resource;
}

/**
 * This determines whether the file at a given pathname should be cached.
 * @param {string} pathname
 * @returns {boolean}
 */
function shouldCache(pathname) {
  if (pathname.endsWith('setup.js')) return false;
  if (pathname.endsWith('service-worker.js')) return false;
  const index = pathname.lastIndexOf('.');
  const extension = index === -1 ? '' : pathname.substring(index + 1);
  return fileExtensionsToCache.includes(extension);
}

//-----------------------------------------------------------------------------

self.addEventListener('install', event => {
  console.log('service-worker.js: installing');
  // This causes a newly installed service worker to
  // progress to the activating state, regardless of
  // whether there is already an active service worker.
  self.skipWaiting();
});

//TODO: Is there an easier way to do this?
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
const publicKey =
  'BMx9QagkN_EidkH7D8jdZaz5BM2Hh-d3RQ5W1iWOfh32KRdbxu7fATv5ozLPUfQasRIZo7JQ6ULGVKgfUX3HO7A';

async function saveSubscription(subscription) {
  const res = await fetch('http://localhost:8787/save-subscription', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(subscription)
  });
  return res.json();
}

self.addEventListener('activate', async event => {
  console.log('service-worker.js: activating');
  // event.waitUntil(deleteCache(cacheName));

  // Safari says "The operation is not supported." for the "estimate" method.
  // const estimate = await navigator.storage.estimate();
  // console.log('setup.js: storage estimate =', estimate);

  const subscription = await self.registration.pushManager.subscribe({
    // To get this public key,
    // enter "npx web-push generate-vapid-keys" in a terminal.
    // vapid stands for "Voluntary APplication server IDentification"
    // and is used for Web Push.
    applicationServerKey: base64StringToUint8Array(publicKey),
    userVisibleOnly: true // false allows silent push notifications
  });
  const res = await saveSubscription(subscription);
  console.log('service-worker.js activate: res =', res);

  try {
    // Let browser clients know that the service worker is ready.
    const clients = await self.clients.matchAll({includeUncontrolled: true});
    for (const client of clients) {
      client.postMessage('service worker ready');
    }
  } catch (error) {
    console.error('setup.js activate: failed to notify clients:', error);
  }
});

// This is not used for the initial load of a PWA,
// only for subsequent loads.
self.addEventListener('fetch', async event => {
  const {request} = event;
  const url = new URL(request.url);
  const {pathname} = url;
  // console.log('service-worker.js fetch: pathname =', pathname);

  // const log = request.method === 'GET' && pathname === '/dog';
  const match = dogRouter.match(request.method, pathname);
  // if (log) console.log('match for GET /dog =', match);
  const promise = match
    ? match.handler(match.params, request)
    : getResource(request);
  event.respondWith(promise);
});

// For testing, this can be triggered from the Chrome DevTools Application tab.
// TODO: Get this type from https://www.npmjs.com/package/@types/serviceworker?
self.addEventListener('push', async event => {
  console.log('service-worker.js push: event =', event);
  const title = event.data.text();
  event.waitUntil(self.registration.showNotification(title));
});
