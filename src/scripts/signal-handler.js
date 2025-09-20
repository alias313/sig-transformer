import { loadJSONToIndexedDB } from './db.js';
import { computeFFTSquare, computeFFTSinc, computeFFTCos, computeFFTTriangle, computeFFTSin, computeFFTExp, computeFFTSign } from './fft-client.js';

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
if (!signalParamsOnReload || !signalParamsOnReload.signalShape) {
    signalParamsOnReload = { ...signalParamsOnReload, signalShape: 'sinc' };
}
console.log("Loaded parameters from LocalStorage:", signalParamsOnReload);

async function fetchSignal(signalParams, update=false) {
    try {
        let fftData = [];
        const normalizedParams = { ...signalParams };

        if (normalizedParams?.signalShape === 'square') {
            fftData = await computeFFTSquare(normalizedParams);
        } else if (normalizedParams?.signalShape === 'sinc') {
            fftData = await computeFFTSinc(normalizedParams);
        } else if (normalizedParams?.signalShape === 'cos') {
            fftData = await computeFFTCos(normalizedParams);
        } else if (normalizedParams?.signalShape === 'triangle') {
            fftData = await computeFFTTriangle(normalizedParams);
        } else if (normalizedParams?.signalShape === 'sin') {
            fftData = await computeFFTSin(normalizedParams);
        } else if (normalizedParams?.signalShape === 'exp') {
            fftData = await computeFFTExp(normalizedParams);
        } else if (normalizedParams?.signalShape === 'sign') {
            fftData = await computeFFTSign(normalizedParams);
        } else {
            console.warn('Only Square, Sinc, Cos, Triangle, Sin, Exp, and Sign are currently supported client-side. Skipping fetch.');
            return;
        }

        await loadJSONToIndexedDB(fftData);
        saveSignalParamsToLocalStorage(normalizedParams);
        if (update) window.updateChartData?.(normalizedParams);

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
