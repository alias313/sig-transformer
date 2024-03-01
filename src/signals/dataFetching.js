export async function getData() {
  const response = await fetch("/src/signals/fft_out.csv");
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
  console.log(inputSignal, outputSignal);

  return { inputSignal, outputSignal };
}
