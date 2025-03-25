import { performance } from "node:perf_hooks";

export async function getData() {
  const startTime = performance.now();
  const response = await fetch("http://localhost:4321/src/signals/fft_out.json");
  const fftData = await response.json();

  const outputSignal = [];
  const inputSignal = [];

  fftData.forEach((row) => {
    outputSignal.push({
      time: parseFloat(row["Freq"]),
      value: parseFloat(row["re(FFT)"]),
    });
    inputSignal.push({
      time: parseFloat(row["input"]),
      value: parseFloat(row["re(signal)"]),
    });
  });

  const endTime = performance.now();

  const outputSignalSliced = outputSignal.slice(
    outputSignal.length / 4,
    outputSignal.length - outputSignal.length / 4
  );

  console.log(`Call to getData took ${endTime - startTime} milliseconds`);

  return { inputSignal, outputSignal, outputSignalSliced };
}
