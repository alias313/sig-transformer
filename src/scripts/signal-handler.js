import { loadJSONToIndexedDB } from './db.js';
import { computeFFTJSquare } from './fft-client.js';

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
        let fftData = [];
        if (signalParams?.signalShape === 'JSquare') {
            fftData = await computeFFTJSquare(signalParams);
        } else {
            console.warn('Only JSquare is currently supported client-side. Skipping fetch.');
            return;
        }

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
// Disable initial fetch since server is down; user will generate locally via JSquare

export { loadSignalParamsFromLocalStorage, fetchSignal };
