declare namespace Demo {
  type Dog = {
    id: number;
    name: string;
    breed: string;
  };

  class DogController {
    constructor(idbEasy: IDBEasy);

    async initialize(txn: IDBTransaction): Promise<void>;

    upgrade(event: IDBVersionChangeEvent): void;

    async addDog(dog: Dog): Promise<Response>;

    async deleteDog(id: number): Promise<Response>;

    async getDogs(): Promise<Response>;

    async updateSnoopy(): Promise<Response>;
  }

  type HandlerType = async (params: object, request: request) => Response;

  class Router {
    constructor();

    get(path: string, handler: HandlerType): Response;
    delete(path: string, handler: HandlerType): Response;
    patch(path: string, handler: HandlerType): Response;
    post(path: string, handler: HandlerType): Response;
  }

  type RouterMatch = {
    method: string;
    path: string;
    handler: () => Response;
  };
}
