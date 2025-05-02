import { useRef, useState, useEffect, useCallback } from 'react';
import { createDB } from '@/scripts/db.js';
import { fetchSignal } from '@/scripts/signal-handler.js';
import { loadSignalParamsFromLocalStorage } from '@/scripts/signal-handler.js';

export function useSignalData() {
  const dbRef = useRef(null);
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const initializeDB = async () => {
      try {
        const db = await createDB();
        if (isMounted) {
          dbRef.current = db;
          setIsDbReady(true);
        }
      } catch (error) {
        console.error('Failed to initialize IndexedDB:', error);
      }
    };
    initializeDB();
    return () => {
      isMounted = false;
    };
  }, []);

  const getData = useCallback(
    async (frequencyLimit, outputType = 'modulus') => {
      if (!isDbReady | !dbRef.current) {
        console.warn('IndexedDB not initialized yet.');
        return { inputSignal: [], outputSignal: [], outputSignalSliced: [] };
      }

      let outputFunction = 'abs';
      switch (outputType) {
        case 'real':
          outputFunction = 're';
          break;
        case 'imaginary':
          outputFunction = 'im';
          break;
        case 'modulus':
        default:
          outputFunction = 'abs';
          break;
      }

      try {
        const data = await dbRef.current.signals.toArray();
        const inputSignal = [];
        const outputSignal = [];

        data.forEach((row) => {
          const freq = parseFloat(row.Freq);
          const inputTime = parseFloat(row.input);
          const inputVal = parseFloat(row['re(signal)']);
          const outputVal = parseFloat(row[`${outputFunction}(FFT)`]);

          if (!isNaN(inputTime) && !isNaN(inputVal)) {
            inputSignal.push({ time: inputTime, value: inputVal });
          }
          if (!isNaN(freq) && !isNaN(outputVal)) {
            outputSignal.push({ time: freq, value: outputVal });
          }
        });

        // Sort just in case data isn't ordered (Lightweight Charts expects ascending time)
        inputSignal.sort((a, b) => a.time - b.time);
        outputSignal.sort((a, b) => a.time - b.time);

        const outputSignalSliced = outputSignal.filter(
          (point) =>
            point.time >= -frequencyLimit && point.time <= frequencyLimit,
        );

        return { inputSignal, outputSignal, outputSignalSliced };
      } catch (error) {
        console.error('Error fetching data from IndexedDB:', error);
        return { inputSignal: [], outputSignal: [], outputSignalSliced: [] };
      }
    },
    [isDbReady],
  );

  return { getData };
}
