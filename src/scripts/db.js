import Dexie from 'dexie';

async function createDB() {
  // Create a new database
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
    // Clear existing data
    await db.signals.clear();

    // Add new data
    await db.signals.bulkAdd(data);

  } catch (error) {
    console.error('Error loading data into IndexedDB:', error);
  }
}

// Export the function to be used elsewhere
export { createDB, loadJSONToIndexedDB };
