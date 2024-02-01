// This file defines the routes that the service worker will handle.
import DogController, {Dog} from './dog-controller';
import {Router} from './tiny-request-router.mjs';

/**
 * This creates a Router for dog API endpoints.
 */
export function getRouter(dogController: DogController): typeof Router {
  const router = new Router();

  router.get('/hello', () => new Response('Hello from service worker!'));

  router.get('/dog', async () => dogController.getDogs());

  router.post('/dog', async (params: object, request: Request) => {
    console.log('dog-router.js post: params =', params);
    console.log('dog-router.js post: request =', request);
    const formData = await request.formData();
    const dog: {[key: string]: any} = {};
    formData.forEach((value: any, key: string) => (dog[key] = value));
    return dogController.addDog(dog as Dog);
  });

  router.put('/dog', async () => dogController.updateSnoopy());

  router.delete('/dog/:id', async (params: {id: number}) =>
    dogController.deleteDog(Number(params.id))
  );

  return router as unknown as typeof Router;
}
