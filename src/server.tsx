import {Context, Hono} from 'hono';
import {serveStatic} from 'hono/bun';
//TODO: web-push does not currently work with Cloudflare Workers!
//TODO: See https://github.com/web-push-libs/web-push/issues/718
//TODO: and https://github.com/aynh/cf-webpush.
// import {serveStatic} from 'hono/cloudflare-workers';

// TODO: Add to notes that this must be installed with `bun add web-push`.
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

//TODO: Get this TypeScript type.
let subscriptions: any[] = [];

function pushNotification(payload: string) {
  if (subscriptions.length) {
    const options = {
      // gcmAPIKey: '?',
      // TTL: 60 // max time in seconds for push service to retry delivery
    };
    for (const subscription of subscriptions) {
      webPush.sendNotification(subscription, payload, options);
    }
  } else {
    console.error('server.tsx: pushMessage called with no subscription');
  }
}

const app = new Hono();

// Serve static files from the public directory.
app.use('/*', serveStatic({root: './public'}));

function TableRow(page: number, pokemon: Pokemon, isLast: boolean) {
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
        return TableRow(pageNumber, pokemon, isLast);
      })}
    </>
  );
});

// To test this, open a new browser tab and
// browse localhost: 8787 / push - notification.
app.get('/push-notification', async (c: Context) => {
  pushNotification('Hello from the server!');
  return c.text('push notification sent');
});

app.post('/save-subscription', async (c: Context) => {
  const subscription = await c.req.json();
  //TODO: Save these in a SQLite database so
  //TODO: they are not lost when the server restarts.
  subscriptions.push(subscription);
  return c.text('');
});

export default app;
