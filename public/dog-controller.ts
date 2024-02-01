import IDBEasy from './idb-easy';
import {button, el, td, tr} from './js2html';

const storeName = 'dogs';

export type Dog = {
  id: number;
  name: string;
  breed: string;
};

/**
 * Converts a Dog object to an HTML string.
 */
function dogToTableRow(dog: Dog): string {
  const {breed, id, name} = dog;
  return tr([
    td(id),
    td(name),
    td(breed),
    td(
      button(
        {
          'hx-confirm': 'Are you sure?',
          'hx-delete': `/dog/${id}`,
          'hx-target': '#dog-table-body'
        },
        '🗑'
      )
    )
  ]);
}

export default class DogController {
  idbEasy: IDBEasy;

  constructor(idbEasy: IDBEasy) {
    this.idbEasy = idbEasy;
  }

  /**
   * This initializes the dogs store with sample data.
   */
  async initialize(txn: IDBTransaction): Promise<void> {
    const ie = this.idbEasy;
    try {
      const count = await ie.getRecordCount(storeName, txn);
      console.log('dogs.js initialize: count =', count);
      if (count > 0) return;

      // Unless the database is deleted and recreated,
      // these records will be recreated with new key values.
      await ie.createRecord(storeName, {name: 'Comet', breed: 'Whippet'}, txn);
      await ie.createRecord(
        storeName,
        {
          name: 'Oscar',
          breed: 'German Shorthaired Pointer'
        },
        txn
      );

      /** @type {Dog[]} */
      const dogs = (await ie.getAllRecords(storeName, txn)) as Dog[];
      const comet = dogs.find(dog => dog.name === 'Comet');
      if (comet) {
        comet.name = 'Fireball';
        await ie.upsertRecord(storeName, comet, txn);
      }

      await ie.upsertRecord(
        storeName,
        {
          name: 'Clarice',
          breed: 'Whippet'
        },
        txn
      );

      /*
      const oscar = await ie.getRecordByKey(storeName, 2, txn);
      console.log('oscar =', oscar);

      const whippets = await ie.getRecordsByIndex(
        storeName,
        'breed-index',
        'Whippet',
        txn
      );
      console.log('whippets =', whippets);

      await ie.deleteRecordByKey(storeName, 2, txn);
      const remainingDogs = await ie.getAllRecords('dogs', txn);
      console.log('remainingDogs =', remainingDogs);
      */
    } catch (error) {
      console.error('dogs.js initialize: error =', error);
    }
  }

  /**
   * This creates the initial stores and indexes in the database
   * or upgrades existing ones.
   */
  upgrade(db: IDBDatabase, event: IDBVersionChangeEvent): Promise<void> {
    const {newVersion, oldVersion} = event;
    const txn = db.transaction(storeName, 'readwrite');

    if (oldVersion === 0) {
      console.log('creating first version of database');
    } else {
      console.log(
        'upgrading database from version',
        oldVersion,
        'to',
        newVersion
      );
    }

    const ie = this.idbEasy;

    // If the "dogs" store already exists, delete it.
    const names = Array.from(txn.objectStoreNames);
    console.log('dog-controller.ts upgrade: names =', names);
    if (names.includes(storeName)) ie.deleteStore(storeName);

    // Recreate the "dogs" store and its indexes.
    const store = ie.createStore(storeName, 'id', true);
    ie.createIndex(store, 'breed-index', 'breed');
    ie.createIndex(store, 'name-index', 'name');

    return this.initialize(txn);
  }

  /**
   * Adds a Dog to the database.
   * @returns {Promise<Response>} HTML for a new table row.
   */
  async addDog(dog: Dog): Promise<Response> {
    const ie = this.idbEasy;
    dog.id = (await ie.createRecord('dogs', dog)) as number;
    const html = dogToTableRow(dog);
    return new Response(html, {
      headers: {'Content-Type': 'application/html'}
    });
  }

  /**
   * Deletes a Dog from the database.
   * @returns {Promise<Response>} HTML for table rows for all remaining dogs.
   */
  async deleteDog(id: number): Promise<Response> {
    const ie = this.idbEasy;
    await ie.deleteRecordByKey('dogs', id);
    return this.getDogs();
  }

  async getDogs() {
    const ie = this.idbEasy;
    const dogs = (await ie.getAllRecords('dogs')) as Dog[];
    const html = dogs.map(dogToTableRow).join('');
    return new Response(html, {
      headers: {'Content-Type': 'application/html'}
    });
  }

  async updateSnoopy() {
    const ie = this.idbEasy;
    await ie.updateRecordsByIndex('dogs', 'name-index', 'Snoopy', 'Woodstock');
    return this.getDogs();
  }
}
