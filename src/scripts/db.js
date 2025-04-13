import Dexie from 'dexie';

async function createDB() {
  const db = new Dexie('SignalDB');
  db.version(1).stores({
    signals: 'Freq'
  });
  return db;
}

async function loadJSONToIndexedDB(jsonData) {
  try {
    const db = new Dexie('SignalDB');
    db.version(1).stores({
      signals: 'Freq'
    });  
    const data = jsonData;
    console.log('Data loaded from JSON file into IndexedDB:');
    console.log(data);
    await db.signals.clear();

    await db.signals.bulkAdd(data);

  } catch (error) {
    console.error('Error loading data into IndexedDB:', error);
  }
}

export { createDB, loadJSONToIndexedDB };
