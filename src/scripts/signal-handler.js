import { loadJSONToIndexedDB } from './db.js';

// Default parameters to use if nothing is found in LocalStorage
const defaultParams = {
    a: -30,
    b: 30,
    signalShape: 'sinc',
    amplitude: 1,
    frequency: 1,
    phase: 0,
    interval: 0.01,
    freqrange: 5
};

// Function to save signal parameters to LocalStorage
function saveSignalParamsToLocalStorage(params) {
    try {
        // Convert the params object to a JSON string
        localStorage.setItem('signalParams', JSON.stringify(params));
        return true;
    } catch (error) {
        console.error('Error saving to LocalStorage:', error);
        return false;
    }
}
    
  
// Function to load signal parameters from LocalStorage
export default function loadSignalParamsFromLocalStorage() {
    try {
      const storedParams = localStorage.getItem('signalParams');
      if (storedParams) {
        // Parse the stored JSON string back into an object
        return JSON.parse(storedParams);
      }
      saveSignalParamsToLocalStorage(defaultParams);
      return defaultParams;
    } catch (error) {
      console.error('Error reading from LocalStorage:', error);
      return defaultParams;
    }
}
    
// Load signal parameters from LocalStorage or use defaults
let signalParamsOnReload = loadSignalParamsFromLocalStorage();
console.log("Loaded parameters from LocalStorage:", signalParamsOnReload);

async function transformSignal(signalParams) {
    // Collect form data to a plain object
    try {
        const response = await fetch('http://localhost:3000/execute-fft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signalParams)
        });
        
        if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // This is where you read the JSON response returned by the server.
        const fftData = await response.json();
        console.log("Received FFT JSON:", fftData);
        await loadJSONToIndexedDB(fftData);
        window.updateChartData?.(signalParams);

        // Now update your charts with the new data.
        // For example, if you have a function to update charts, call it with fftData.
        // updateCharts(fftData);
        
    } catch (error) {
        console.error('Error executing FFT:', error);
        alert('Error executing FFT');
    }
}

const dbName = 'SignalDB';
const isExisting = (await window.indexedDB.databases()).map(db => db.name).includes(dbName);
console.log("DB exists:", isExisting);
// Doesn't cover the case when DB exists but there is no table/data
if (!isExisting){
    console.log("Creating new database");
    transformSignal(signalParamsOnReload);
}

export { transformSignal };
