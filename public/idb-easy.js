function requestToPromise(request, action, suppliedTxn = false) {
  return new Promise((resolve, reject) => {
    request.onsuccess = event => {
      // console.log('succeeded to', action);
      if (!suppliedTxn) request.transaction?.commit();
      resolve(request.result);
    };
    request.onerror = event => {
      console.error('failed to', action);
      request.transaction.abort();
      reject(event);
    };
  });
}

export default class IDBEasy {
  constructor(db) {
    this.db = db;
  }

  clearStore(storeName, txn) {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readwrite');
    const store = txn.objectStore(storeName);
    const request = store.clear();
    return requestToPromise(request, 'clear store', suppliedTxn);
  }

  createIndex(store, indexName, keyPath, unique = false) {
    store.createIndex(indexName, keyPath, {unique});
  }

  createRecord(storeName, object, txn) {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readwrite');
    const store = txn.objectStore(storeName);
    const request = store.add(object);
    return requestToPromise(request, 'create record', suppliedTxn);
  }

  // This must be called within a "versionchnage" transaction.
  createStore(storeName, keyPath, autoIncrement = false) {
    return this.db.createObjectStore(storeName, {autoIncrement, keyPath});
  }

  static deleteDB(dbName) {
    const request = indexedDB.deleteDatabase(dbName);
    return requestToPromise(request, 'delete database');
  }

  deleteRecordsByIndex(storeName, indexName, value, txn) {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const store = txn.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = event => {
        const records = event.target.result;
        for (const record of records) {
          store.delete(record[store.keyPath]);
        }
        if (!suppliedTxn) txn.commit();
        resolve();
      };
      request.onerror = event => {
        console.error('failed to delete records by index');
        txn.abort();
        reject(event);
      };
    });
  }

  deleteRecordByKey(storeName, key, txn) {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readwrite');
    const store = txn.objectStore(storeName);
    const request = store.delete(key);
    return requestToPromise(request, 'delete dog', suppliedTxn);
  }

  deleteStore(storeName) {
    this.db.deleteObjectStore(storeName);
  }

  getAllRecords(storeName, txn) {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readonly');
    const store = txn.objectStore(storeName);
    const request = store.getAll();
    return requestToPromise(request, 'get all records', suppliedTxn);
  }

  getRecordByKey(storeName, key, txn) {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readonly');
    const store = txn.objectStore(storeName);
    const request = store.get(key);
    return requestToPromise(request, 'get record by key', suppliedTxn);
  }

  getRecordCount(storeName, txn) {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readonly');
    const store = txn.objectStore(storeName);
    const request = store.count();
    return requestToPromise(request, 'get record count', suppliedTxn);
  }

  getRecordsByIndex(storeName, indexName, indexValue, txn) {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readonly');
    const store = txn.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(indexValue);
    return requestToPromise(request, 'get records by index', suppliedTxn);
  }

  static openDB(dbName, version, upgrade) {
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
        const db = request.result;
        upgrade(db, event);
      };
    });
  }

  updateRecordsByIndex(storeName, indexName, oldValue, newValue, txn) {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const store = txn.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(oldValue);
      request.onsuccess = event => {
        const records = event.target.result;
        for (const record of records) {
          record[index.keyPath] = newValue;
          store.put(record);
        }
        if (!suppliedTxn) txn.commit();
        resolve();
      };
      request.onerror = event => {
        console.error('failed to update records by index');
        txn.abort();
        reject(event);
      };
    });
  }

  upsertRecord(storeName, object, txn) {
    const suppliedTxn = Boolean(txn);
    if (!suppliedTxn) txn = this.db.transaction(storeName, 'readwrite');
    const store = txn.objectStore(storeName);
    const request = store.put(object);
    return requestToPromise(request, 'update dog', suppliedTxn);
  }
}
