import { loadJSONToIndexedDB } from './db.js';

// Default parameters to use if nothing is found in LocalStorage
const defaultParams = {
    a: -20,
    b: 20,
    signalShape: 'sinc',
    amplitude: 1,
    frequency: 1,
    phase: 0,
    interval: 0.01,
    freqrange: 4
};

function saveSignalParamsToLocalStorage(params) {
    try {
        localStorage.setItem('signalParams', JSON.stringify(params));
        return true;
    } catch (error) {
        console.error('Error saving to LocalStorage:', error);
        return false;
    }
}
    
  
export default function loadSignalParamsFromLocalStorage() {
    try {
      const storedParams = localStorage.getItem('signalParams');
      if (!storedParams) {
        saveSignalParamsToLocalStorage(defaultParams);
        return JSON.parse(defaultParams);
      }
      return JSON.parse(storedParams);
    } catch (error) {
      console.error('Error reading from LocalStorage:', error);
      return defaultParams;
    }
}
    
let signalParamsOnReload = loadSignalParamsFromLocalStorage();
console.log("Loaded parameters from LocalStorage:", signalParamsOnReload);

async function fetchSignal(signalParams, update=false) {
    try {
        const response = await fetch('https://srv785333.hstgr.cloud/execute-fft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signalParams)
        });
        
        if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const fftData = await response.json();
        await loadJSONToIndexedDB(fftData);
        saveSignalParamsToLocalStorage(signalParams);
        if (update) window.updateChartData?.(signalParams);
  
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
    if (typeof window.showChartLoading === 'function') {
        window.showChartLoading();
    }
    await fetchSignal(signalParamsOnReload, true);
}

export { loadSignalParamsFromLocalStorage, fetchSignal };
