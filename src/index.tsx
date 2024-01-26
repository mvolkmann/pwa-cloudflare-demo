import { Context, Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";

type Pokemon = {
  name: string;
  url: string;
};

const POKEMON_IMAGE_URL_PREFIX =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
const POKEMON_URL_PREFIX = "https://pokeapi.co/api/v2/pokemon-species";
const ROWS_PER_PAGE = 10;

const app = new Hono();

// Serve static files from the public directory.
app.use("/*", serveStatic({ root: "./" }));

app.get("/get-text", (c) => {
  return c.text("This is text.");
});

app.get("/get-html", (c) => {
  return c.html(<b>This is HTML.</b>);
});

function TableRow(page: number, pokemon: Pokemon, isLast: boolean) {
  const attributes = isLast
    ? {
        "hx-trigger": "revealed",
        "hx-get": "/pokemon-rows?page=" + (page + 1),
        "hx-indicator": ".htmx-indicator",
        "hx-swap": "afterend",
      }
    : {};
  const { name, url } = pokemon;
  const id = url.split("/")[6]; // 7th part of the URL
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

app.get("/pokemon-rows", async (c: Context) => {
  const page = c.req.query("page");
  if (!page) throw new Error("page query parameter is required");

  // Bun.sleepSync(500); // simulates long-running query

  const pageNumber = Number(page);
  const offset = (pageNumber - 1) * ROWS_PER_PAGE;
  const url = POKEMON_URL_PREFIX + `?offset=${offset}&limit=${ROWS_PER_PAGE}`;
  const response = await fetch(url);
  const json = await response.json();
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
export default app;
