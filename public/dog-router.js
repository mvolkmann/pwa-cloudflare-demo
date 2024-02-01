// This file defines the routes that the service worker will handle.
import DogController from './dog-controller';
import {Router} from './tiny-request-router.mjs';

/**
 * @typedef {{id: number, name: string, breed: string}} Dog
 */

/**
 * This creates a Router for dog API endpoints.
 * @param {DogController} dogController
 * @returns {Router}
 */
export function getRouter(dogController) {
  const router = new Router();

  router.get('/hello', () => new Response('Hello from service worker!'));

  router.get('/dog', async () => {
    return dogController.getDogs();
  });

  router.post('/dog', async (params, request) => {
    const formData = await request.formData();
    const dog = Object.fromEntries(formData);
    return dogController.addDog(dog);
  });

  router.put('/dog', async () => {
    return dogController.updateSnoopy();
  });

  router.delete('/dog/:id', async params => {
    return dogController.deleteDog(Number(params.id));
  });

  return router;
}
