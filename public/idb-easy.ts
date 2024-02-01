/**
 * This returns a Promise that resolves to the result of a given request.
 */
function requestToPromise(
  request: IDBRequest,
  action: string,
  suppliedTxn: boolean = false
): Promise<any> {
  return new Promise((resolve, reject) => {
    request.onsuccess = event => {
      // console.log('succeeded to', action);
      if (!suppliedTxn) request.transaction?.commit();
      resolve(request.result);
    };
    request.onerror = event => {
      console.error('failed to', action);
      request.transaction?.abort();
      reject(event);
    };
  });
}

type UpgradeCallback = (
  request: IDBRequest,
  event: IDBVersionChangeEvent
) => void;

export default class IDBEasy {
  db: IDBDatabase;

  constructor(db: IDBDatabase) {
    this.db = db;
  }

  /**
   * This deletes all the records in a given store.
   */
  clearStore(storeName: string, txn?: IDBTransaction): Promise<void> {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readwrite');
    const store = txn!.objectStore(storeName);
    const request = store.clear();
    return requestToPromise(request, 'clear store', suppliedTxn);
  }

  /**
   * This creates an index on a given store.
   */
  createIndex(
    store: IDBObjectStore,
    indexName: string,
    keyPath: string,
    unique: boolean = false
  ): void {
    store.createIndex(indexName, keyPath, {unique});
  }

  /**
   * This creates a record in a given store.
   */
  createRecord(
    storeName: string,
    object: object,
    txn?: IDBTransaction
  ): Promise<number | string> {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readwrite');
    const store = txn!.objectStore(storeName);
    const request = store.add(object);
    return requestToPromise(request, 'create record', suppliedTxn);
  }

  /**
   * This creates a store in the current database.
   * It must be called within a "versionchange" transaction.
   */
  createStore(
    storeName: string,
    keyPath: string,
    autoIncrement: boolean = false
  ): IDBObjectStore {
    return this.db.createObjectStore(storeName, {autoIncrement, keyPath});
  }

  /**
   * This deletes a given database
   */
  static deleteDB(dbName: string): Promise<void> {
    const request = indexedDB.deleteDatabase(dbName);
    return requestToPromise(request, 'delete database');
  }

  /**
   * This deletes all the records in a given store
   * that have a given value in a given index.
   */
  deleteRecordsByIndex(
    storeName: string,
    indexName: string,
    indexValue: any,
    txn?: IDBTransaction
  ): Promise<void> {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const store = txn!.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(indexValue);
      request.onsuccess = event => {
        const records = request.result;
        for (const record of records) {
          store.delete(record[store.keyPath as string]);
        }
        if (!suppliedTxn) txn!.commit();
        resolve();
      };
      request.onerror = event => {
        console.error('failed to delete records by index');
        txn!.abort();
        reject(event);
      };
    });
  }

  /**
   * This delete the record in a given store
   * that has a given key value.
   */
  deleteRecordByKey(
    storeName: string,
    key: any,
    txn?: IDBTransaction
  ): Promise<void> {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readwrite');
    const store = txn!.objectStore(storeName);
    const request = store.delete(key);
    return requestToPromise(request, 'delete dog', suppliedTxn);
  }

  /**
   * This deletes a given store.
   */
  deleteStore(storeName: string): void {
    this.db.deleteObjectStore(storeName);
  }

  /**
   * This gets all the record in a given store.
   */
  getAllRecords(storeName: string, txn?: IDBTransaction): Promise<object[]> {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readonly');
    const store = txn!.objectStore(storeName);
    const request = store.getAll();
    return requestToPromise(request, 'get all records', suppliedTxn);
  }

  /**
   * This gets the record in a given store with a given key value.
   */
  getRecordByKey(
    storeName: string,
    key: any,
    txn?: IDBTransaction
  ): Promise<object> {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readonly');
    const store = txn!.objectStore(storeName);
    const request = store.get(key);
    return requestToPromise(request, 'get record by key', suppliedTxn);
  }

  /**
   * This gets the number of records in a given store.
   */
  getRecordCount(storeName: string, txn?: IDBTransaction): Promise<number> {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readonly');
    const store = txn!.objectStore(storeName);
    const request = store.count();
    return requestToPromise(request, 'get record count', suppliedTxn);
  }

  /**
   * This gets all the records in a given store
   * that have a given value in a given index.
   */
  getRecordsByIndex(
    storeName: string,
    indexName: string,
    indexValue: any,
    txn?: IDBTransaction
  ): Promise<object[]> {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readonly');
    const store = txn!.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(indexValue);
    return requestToPromise(request, 'get records by index', suppliedTxn);
  }

  /**
   * This opens a given database.
   */
  static openDB(
    dbName: string,
    version: number,
    upgrade: UpgradeCallback
  ): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version);

      request.onsuccess = async event => {
        const db = request.result;
        resolve(db);
      };

      request.onerror = event => {
        console.error(`failed to open database ${dbName}`);
        reject(event);
      };

      request.onupgradeneeded = event => {
        upgrade(request, event);
      };
    });
  }

  /**
   * This updates all records in a given store
   * that have a given value for a given index
   * to a new value.
   * @param {string} storeName
   * @param {string} indexName
   * @param {any} oldValue
   * @param {any} newValue
   * @param {IDBTransaction} txn
   * @returns {Promise<void>}
   */
  updateRecordsByIndex(
    storeName: string,
    indexName: string,
    oldValue: any,
    newValue: any,
    txn?: IDBTransaction
  ): Promise<void> {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const store = txn!.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(oldValue);
      request.onsuccess = (event: Event) => {
        const records = request.result;
        for (const record of records) {
          record[index.keyPath as string] = newValue;
          store.put(record);
        }
        if (!suppliedTxn) txn!.commit();
        resolve();
      };
      request.onerror = event => {
        console.error('failed to update records by index');
        txn!.abort();
        reject(event);
      };
    });
  }

  /**
   * This inserts or updates a record in a given store.
   */
  upsertRecord(
    storeName: string,
    object: object,
    txn?: IDBTransaction
  ): Promise<object> {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readwrite');
    const store = txn!.objectStore(storeName);
    const request = store.put(object);
    return requestToPromise(request, 'update dog', suppliedTxn);
  }
}
