// TODO: Is this file being used?
declare class DogController {
  constructor(idbEasy: IDBEasy);

  async initialize(txn: IDBTransaction): Promise<void>;

  upgrade(event: IDBVersionChangeEvent): void;

  async addDog(dog: Dog): Promise<Response>;

  async deleteDog(id: number): Promise<Response>;

  async getDogs(): Promise<Response>;

  async updateSnoopy(): Promise<Response>;
}
