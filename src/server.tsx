import {Database} from 'bun:sqlite';
import {Context, Hono} from 'hono';
import {serveStatic} from 'hono/bun';

// We cannot use the following import because the web-push package
// does not currently work with Cloudflare Workers!
// See https://github.com/web-push-libs/web-push/issues/718
// and https://github.com/aynh/cf-webpush.
// import {serveStatic} from 'hono/cloudflare-workers';

// Prepare to use a SQLite database.
type DBSubscription = {id: number; json: string};
const db = new Database('pwa.db', {create: true});
const deleteTodoPS = db.prepare('delete from subscriptions where id = ?');
const getAllSubscriptions = db.query('select * from subscriptions;');
const insertSubscription = db.query(
  'insert into subscriptions (json) values (?)'
);

// Restore previous subscriptions from database.
const dbSubscriptions = getAllSubscriptions.all() as DBSubscription[];
let subscriptions = dbSubscriptions.map(dbSub => {
  const subscription = JSON.parse(dbSub.json);
  subscription.id = dbSub.id;
  return subscription;
});

// Setup use of the web-push package.
// For details, see https://github.com/web-push-libs/web-push.
const webPush = require('web-push');
webPush.setVapidDetails(
  'mailto:r.mark.volkmann@gmail.com',
  process.env.WEB_PUSH_PUBLIC_KEY,
  process.env.WEB_PUSH_PRIVATE_KEY
);

type Pokemon = {
  name: string;
  url: string;
};

const POKEMON_IMAGE_URL_PREFIX =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
const POKEMON_URL_PREFIX = 'https://pokeapi.co/api/v2/pokemon-species';
const ROWS_PER_PAGE = 10;

// This demonstrates triggering push notifications from a server.
// It sends a new push notification every 5 seconds.
let count = 0;
setInterval(() => {
  // console.log('server.tsx: subscriptions.length =', subscriptions.length);
  if (subscriptions.length) {
    count++;
    const payload = JSON.stringify({
      title: 'From server.tsx',
      body: `count = ${count}`,
      icon: 'subscribe.png'
    });
    pushNotification(payload);
  }
}, 5000);

//-----------------------------------------------------------------------------

/**
 * This sends a push notifications to all subscribers.
 */
async function pushNotification(payload: string | object) {
  if (subscriptions.length) {
    const badSubscriptions = [];
    const options = {
      TTL: 60 // max time in seconds for push service to retry delivery
    };

    for (const subscription of subscriptions) {
      try {
        // This will fail if the subscription is no longer valid.
        await webPush.sendNotification(subscription, payload, options);
      } catch (error) {
        const message = error.body || error;
        console.error('server.tsx pushNotification:', message);
        badSubscriptions.push(subscription);
      }
    }

    for (const subscription of badSubscriptions) {
      // Remove the subscription from the database.
      deleteTodoPS.run(subscription.id);

      subscriptions = subscriptions.filter(s => s.id !== subscription.id);
    }
  } else {
    console.error('server.tsx pushNotification: no clients have subscribed');
  }
}

function tableRow(page: number, pokemon: Pokemon, isLast: boolean) {
  const attributes = isLast
    ? {
        'hx-trigger': 'revealed',
        'hx-get': '/pokemon-rows?page=' + (page + 1),
        'hx-indicator': '.htmx-indicator',
        'hx-swap': 'afterend'
      }
    : {};
  const {name, url} = pokemon;
  const id = url.split('/')[6]; // 7th part of the URL
  const imageUrl = `${POKEMON_IMAGE_URL_PREFIX}${id}.png`;

  return (
    <tr {...attributes}>
      <td>{id}</td>
      <td>{name}</td>
      <td>
        <img alt={name} src={imageUrl} />
      </td>
    </tr>
  );
}

//-----------------------------------------------------------------------------

const app = new Hono();

// Serve static files from the public directory.
app.use('/*', serveStatic({root: './public'}));

/**
 * This gets HTML table rows for a "page" of Pokemon.
 */
app.get('/pokemon-rows', async (c: Context) => {
  const page = c.req.query('page');
  if (!page) throw new Error('page query parameter is required');

  // Bun.sleepSync(500); // simulates long-running query

  const pageNumber = Number(page);
  const offset = (pageNumber - 1) * ROWS_PER_PAGE;
  const url = POKEMON_URL_PREFIX + `?offset=${offset}&limit=${ROWS_PER_PAGE}`;
  const response = await fetch(url);
  const json = (await response.json()) as {results: Pokemon[]};
  const pokemonList = json.results as Pokemon[];

  return c.html(
    <>
      {pokemonList.map((pokemon, index) => {
        const isLast = index === ROWS_PER_PAGE - 1;
        return tableRow(pageNumber, pokemon, isLast);
      })}
    </>
  );
});

/**
 * This endpoint saves a push notification subscription.
 */
app.post('/save-subscription', async (c: Context) => {
  const subscription = await c.req.json();
  subscriptions.push(subscription);

  // Save subscriptions in a SQLite database so
  // they are not lost when the server restarts.
  const json = JSON.stringify(subscription);
  insertSubscription.get(json);

  return c.text('');
});

export default app;
