import { performance } from "node:perf_hooks";

export async function getData() {
  const startTime = performance.now();
  const response = await fetch("http://localhost:4321/src/signals/fft_out.csv");
  const fftString = await response.text();
  const outputSignal = [];
  const inputSignal = [];

  const fftTable = fftString.split("\n").slice(1, -1);
  fftTable.forEach((row) => {
    const columns = row.split(",");
    outputSignal.push({
      time: parseFloat(columns[0]),
      value: parseFloat(columns[1]),
    });
    inputSignal.push({
      time: parseFloat(columns[3]),
      value: parseFloat(columns[4]),
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
