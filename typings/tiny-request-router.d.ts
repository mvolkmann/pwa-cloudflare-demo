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
