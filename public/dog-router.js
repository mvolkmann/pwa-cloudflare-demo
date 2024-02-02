// This file defines the routes that the service worker will handle.
import DogController from './dog-controller.js';
import {Router} from './tiny-request-router.mjs';

/**
 * @typedef {import('./dog-controller.js').Dog} Dog
 */

/**
 * This creates a Router for dog API endpoints.
 * @param {DogController} dogController
 * @returns {Router}
 */
export function getRouter(dogController) {
  const router = new Router();

  router.get('/hello', () => new Response('Hello from service worker!'));

  router.get('/dog', async () => dogController.getDogs());

  /**
   * @typedef {object} Params
   * @property {number} id
   */

  /**
   * @param {Params} params
   * @param {Request} request
   * @returns {Promise<Response>}
   */
  async function postHandler(params, request) {
    const formData = await request.formData();
    /** @type Dog */
    const dog = Object.fromEntries(formData);
    return dogController.addDog(dog);
  }
  router.post('/dog', postHandler);

  router.put('/dog', async () => dogController.updateSnoopy());

  /**
   * @param {Params} params
   * @returns {Promise<Response>}
   */
  function deleteHandler(params) {
    return dogController.deleteDog(Number(params.id));
  }
  router.delete('/dog/:id', deleteHandler);

  return router;
}
