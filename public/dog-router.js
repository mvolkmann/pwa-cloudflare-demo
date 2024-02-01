// This file defines the routes that the service worker will handle.
import {Router} from './tiny-request-router.mjs';

/**
 * This creates a Router for dog API endpoints.
 * @param {Demo.DogController} dogController
 * @returns {Router}
 */
export function getRouter(dogController) {
  const router = new Router();

  router.get('/hello', () => new Response('Hello from service worker!'));

  router.get('/dog', async () => dogController.getDogs());

  router.post('/dog', async (params, request) => {
    console.log('dog-router.js post: params =', params);
    console.log('dog-router.js post: request =', request);
    const formData = await request.formData();
    /** @type Demo.Dog */
    const dog = Object.fromEntries(formData);
    return dogController.addDog(dog);
  });

  router.put('/dog', async () => dogController.updateSnoopy());

  router.delete('/dog/:id', async params =>
    dogController.deleteDog(Number(params.id))
  );

  return router;
}
