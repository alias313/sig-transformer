import { db } from './db.js';

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

  } catch (error) {
    console.error('Error loading data into IndexedDB:', error);
  }
}

// Export the function to be used elsewhere
export { loadJSONToIndexedDB };
