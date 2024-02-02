// TODO: This doesn't seem to be used.
// TODO: I tried adding the following in tsconfig.json,
// TODO: but it didn't changing the output of "tsc --noEmit".
// TODO: "paths": { "*": ["./typings/*"] },
declare module 'tiny-request-router' {
  type HandlerFn = (params: object, request: Request) => Promise<Response>;

  class Router {
    constructor();

    get(path: string, handler: HandlerFn): Response;
    delete(path: string, handler: HandlerFn): Response;
    patch(path: string, handler: HandlerFn): Response;
    post(path: string, handler: HandlerFn): Response;
  }
}
