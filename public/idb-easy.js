function requestToPromise(request, action) {
  return new Promise((resolve, reject) => {
    request.onsuccess = event => {
      // console.log('succeeded to', action);
      request.transaction.commit();
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
    if (!txn) txn = this.db.transaction(storeName, 'readwrite');
    const store = txn.objectStore(storeName);
    const request = store.clear();
    return requestToPromise(request, 'clear store');
  }

  createIndex(store, indexName, keyPath, unique = false) {
    store.createIndex(indexName, keyPath, {unique});
  }

  createStore(storeName, keyPath, autoIncrement = false) {
    return this.db.createObjectStore(storeName, {autoIncrement, keyPath});
  }

  createRecord(storeName, object, txn) {
    if (!txn) txn = this.db.transaction(storeName, 'readwrite');
    const store = txn.objectStore(storeName);
    const request = store.add(object);
    return requestToPromise(request, 'create record');
  }

  deleteDB(dbName) {
    const request = indexedDB.deleteDatabase(dbName);
    return requestToPromise(request, 'delete database');
  }

  deleteRecordsByIndex(storeName, indexName, value, txn) {
    if (!txn) txn = this.db.transaction(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const store = txn.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = event => {
        const records = event.target.result;
        for (const record of records) {
          store.delete(record[store.keyPath]);
        }
        txn.commit();
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
    if (!txn) txn = this.db.transaction(storeName, 'readwrite');
    const store = txn.objectStore(storeName);
    const request = store.delete(key);
    return requestToPromise(request, 'delete dog');
  }

  deleteStore(storeName) {
    this.db.deleteObjectStore(storeName);
  }

  getAllRecords(storeName, txn) {
    if (!txn) txn = this.db.transaction(storeName, 'readonly');
    const store = txn.objectStore(storeName);
    const request = store.getAll();
    return requestToPromise(request, 'get all records');
  }

  getRecordByKey(storeName, key, txn) {
    if (!txn) txn = this.db.transaction(storeName, 'readonly');
    const store = txn.objectStore(storeName);
    const request = store.get(key);
    return requestToPromise(request, 'get record by key');
  }

  getRecordCount(storeName, txn) {
    if (!txn) txn = this.db.transaction(storeName, 'readonly');
    const store = txn.objectStore(storeName);
    const request = store.count();
    return requestToPromise(request, 'get record count');
  }

  getRecordsByIndex(storeName, indexName, indexValue, txn) {
    if (!txn) txn = this.db.transaction(storeName, 'readonly');
    const store = txn.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(indexValue);
    return requestToPromise(request, 'get records by index');
  }

  updateRecordsByIndex(storeName, indexName, oldValue, newValue, txn) {
    if (!txn) txn = this.db.transaction(storeName, 'readwrite');
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
        txn.commit();
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
    if (!txn) txn = this.db.transaction(storeName, 'readwrite');
    const store = txn.objectStore(storeName);
    const request = store.put(object);
    return requestToPromise(request, 'update dog');
  }
}
