type Dog = {
  id: number;
  name: string;
  breed: string;
};

class DogController {
  constructor(idbEasy: IDBEasy);
  addDog(dog: Dog): Promise<Response>;
  deleteDog(id: number): Promise<Response>;
  getDogs(): Promise<Response>;
  initialize(txn: IDBTransaction): Promise<void>;
  updateSnoopy(): Promise<Response>;
  upgrade(event: IDBVersionChangeEvent): void;
}

type UpgradeCallback = (db: IDBDatabase, event: IDBVersionChangeEvent) => void;

class IDBEasy {
  constructor(db: IDBDatabase);
  clearStore(storeName: string, txn: IDBTransaction): Promise<void>;
  createIndex(
    store: IDBObjectStore,
    indexName: string,
    keyPath: string,
    unique?: boolean
  ): void;
  createRecord(
    storeName: string,
    object: object,
    txn: IDBTransaction
  ): Promise<number | string>;
  createStore(
    storeName: string,
    keyPath: string,
    autoIncrement?: boolean
  ): IDBObjectStore;
  static deleteDB(dbName: string): Promise<void>;
  deleteRecordsByIndex(
    storeName: string,
    indexName: string,
    indexValue: any,
    txn: IDBTransaction
  ): Promise<void>;
  deleteRecordByKey(
    storeName: string,
    key: any,
    txn: IDBTransaction
  ): Promise<void>;
  deleteStore(storeName: string): void;
  getAllRecords(storeName: string, txn: IDBTransaction): Promise<object[]>;
  getRecordByKey(
    storeName: string,
    key: any,
    txn: IDBTransaction
  ): Promise<object>;
  getRecordCount(storeName: string, txn: IDBTransaction): Promise<number>;
  getRecordsByIndex(
    storeName: string,
    indexName: string,
    indexValue: any,
    txn: IDBTransaction
  ): Promise<object[]>;
  static openDB(
    dbName: string,
    version: number,
    upgrade: UpgradeCallback
  ): Promise<IDBDatabase>;
  updateRecordsByIndex(
    storeName: string,
    indexName: string,
    oldValue: any,
    newValue: any,
    txn: IDBTransaction
  ): Promise<void>;
  upsertRecord(
    storeName: string,
    object: object,
    txn: IDBTransaction
  ): Promise<object>;
}

type RouterMatch = {
  method: string;
  path: string;
  handler: () => Response;
};
