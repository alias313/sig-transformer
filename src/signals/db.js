import Dexie from 'dexie';

// Create a new database
const db = new Dexie('SignalDB');
db.version(1).stores({
  signals: 'Freq'
});

export default db;
