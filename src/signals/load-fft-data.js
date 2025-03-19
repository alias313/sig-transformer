import Dexie from 'dexie';

// Create a new database
const db = new Dexie('SignalDB');
db.version(1).stores({
  signals: 'Freq'
});

async function loadJSONToIndexedDB() {
  try {
    const response = await fetch('./src/signals/fft_out.json');
    const data = await response.json();
    console.log('Data loaded from JSON file into IndexedDB:');
    console.log(data);
    // Clear existing data
    await db.signals.clear();

    // Add new data
    await db.signals.bulkAdd(data);

    console.log('Data loaded into IndexedDB successfully');
  } catch (error) {
    console.error('Error loading data into IndexedDB:', error);
  }
}

// Export the function to be used elsewhere
export { loadJSONToIndexedDB };