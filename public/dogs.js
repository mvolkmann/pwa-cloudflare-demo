import {button, div, p, table, td, th, tr} from './js2html.js';
const storeName = 'dogs';

function dogToTableRow(dog) {
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

export default class Dogs {
  constructor(idbEasy) {
    this.idbEasy = idbEasy;
  }

  async initialize() {
    const ie = this.idbEasy;
    const count = await ie.getRecordCount(storeName);
    if (count === 0) {
      // Unless the database is deleted and recreated,
      // these records will be recreated with new key values.
      await ie.createRecord(storeName, {name: 'Comet', breed: 'Whippet'});
      await ie.createRecord(storeName, {
        name: 'Oscar',
        breed: 'German Shorthaired Pointer'
      });

      const dogs = await ie.getAllRecords(storeName);

      const comet = dogs.find(dog => dog.name === 'Comet');
      if (comet) {
        comet.name = 'Fireball';
        await ie.upsertRecord(storeName, comet);
      }

      await ie.upsertRecord(storeName, {
        name: 'Clarice',
        breed: 'Whippet'
      });
    }

    /*
    const oscar = await ie.getRecordByKey(storeName, 2);
    console.log('oscar =', oscar);

    const whippets = await ie.getRecordsByIndex(
      storeName,
      'breed-index',
      'Whippet'
    );
    console.log('whippets =', whippets);

    await ie.deleteRecordByKey(storeName, 2);
    const remainingDogs = await ie.getAllRecords('dogs');
    console.log('remainingDogs =', remainingDogs);
    */
  }

  upgrade(event) {
    const {newVersion, oldVersion} = event;
    if (oldVersion === 0) {
      console.log('creating first version');
    } else {
      console.log('upgrading from version', oldVersion, 'to', newVersion);
    }

    const ie = this.idbEasy;

    // If the "dogs" store already exists, delete it.
    const txn = event.target.transaction;
    const names = Array.from(txn.objectStoreNames);
    if (names.includes(storeName)) ie.deleteStore(storeName);

    // Recreate the "dogs" store and its indexes.
    const store = ie.createStore(storeName, 'id', true);
    ie.createIndex(store, 'breed-index', 'breed');
    ie.createIndex(store, 'name-index', 'name');
  }

  async addDog(dog) {
    const ie = this.idbEasy;
    dog.id = await ie.createRecord('dogs', dog);
    const html = dogToTableRow(dog);
    return new Response(html, {
      headers: {'Content-Type': 'application/html'}
    });
  }

  async deleteDog(id) {
    const ie = this.idbEasy;
    await ie.deleteRecordByKey('dogs', id);
    return this.getDogs();
  }

  async getDogs() {
    const ie = this.idbEasy;
    const dogs = await ie.getAllRecords('dogs');
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
