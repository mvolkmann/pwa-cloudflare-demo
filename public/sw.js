// This uses the Workbox library.
// See https://developers.google.com/web/tools/workbox/.

const pageStrategy = new CacheFirst({
  // Put all cached files in a cache named 'pages'
  cacheName: 'pages',
  plugins: [
    // Only requests that return with a 200 status are cached
    new CacheableResponsePlugin({
      statuses: [200]
    })
  ]
});

// Cache page navigations (HTML) with a Cache First strategy
registerRoute(({request}) => request.mode === 'navigate', pageStrategy);
