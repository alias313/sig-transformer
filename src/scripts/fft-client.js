import FFT from 'fft.js';

function nextPowerOfTwo(n) {
  if (n <= 1) return 1;
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function fftShiftIndex(idx, size) {
  const center = Math.floor(size / 2);
  return (idx + center) % size;
}

function roundTo(value, decimals) {
  if (!Number.isFinite(value)) return value;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export async function computeFFTSquare(params) {
  const a = parseFloat(params.a);
  const b = parseFloat(params.b);
  const amp = parseFloat(params.amplitude);
  const pulseLength = parseFloat(params.frequency); // Duration (P)
  const phase = parseFloat(params.phase); // Translate (X)
  const interval = parseFloat(params.interval);

  if (!(b - a > 0)) {
    throw new Error('Invalid interval: b - a must be > 0');
  }

  const totalSamples = Math.ceil((b - a) / interval) + 1;
  const paddedSize = nextPowerOfTwo(totalSamples);

  const realInput = new Float64Array(paddedSize);
  const timeValues = new Float64Array(totalSamples);
  const signalValues = new Float64Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = a + i * interval;
    timeValues[i] = t;
    if (Math.abs(t - phase) < pulseLength / 2 + interval / 2) {
      signalValues[i] = amp;
    } else {
      signalValues[i] = 0;
    }
    realInput[i] = signalValues[i];
  }
  // zero padding already present for i >= totalSamples

  const fft = new FFT(paddedSize);
  const out = fft.createComplexArray();
  fft.realTransform(out, realInput);
  fft.completeSpectrum(out);

  const center = Math.floor(paddedSize / 2);
  const rows = [];

  for (let k = 0; k < paddedSize; k++) {
    const srcIdx = fftShiftIndex(k, paddedSize);
    const reRaw = out[2 * srcIdx];
    const imRaw = out[2 * srcIdx + 1];
    const reScaled = reRaw * interval;
    const imScaled = imRaw * interval;
    const absScaled = Math.hypot(reScaled, imScaled);
    const freq = (k - center) / (paddedSize * interval);

    // Only provide time-domain samples for the original length.
    // Padded rows will have NaN so they are ignored by consumers.
    const inputTime = k < totalSamples ? timeValues[k] : NaN;
    const inputVal = k < totalSamples ? signalValues[k] : NaN;

    const freqRounded = roundTo(freq, 2);
    const reRounded = roundTo(reScaled, 5);
    const imRounded = roundTo(imScaled, 5);
    const absRounded = roundTo(absScaled, 5);
    const inputTimeRounded = Number.isFinite(inputTime) ? roundTo(inputTime, 5) : inputTime;
    const inputValRounded = Number.isFinite(inputVal) ? roundTo(inputVal, 5) : inputVal;

    rows.push({
      Freq: freqRounded,
      're(FFT)': reRounded,
      'im(FFT)': imRounded,
      'abs(FFT)': absRounded,
      input: inputTimeRounded,
      're(signal)': inputValRounded,
    });
  }

  return rows;
}

export async function computeFFTSinc(params) {
  const a = parseFloat(params.a);
  const b = parseFloat(params.b);
  const amp = parseFloat(params.amplitude);
  const f0 = parseFloat(params.frequency);
  const phase = parseFloat(params.phase);
  const interval = parseFloat(params.interval);

  if (!(b - a > 0)) {
    throw new Error('Invalid interval: b - a must be > 0');
  }

  const totalSamples = Math.ceil((b - a) / interval) + 1;
  const paddedSize = nextPowerOfTwo(totalSamples);

  const realInput = new Float64Array(paddedSize);
  const timeValues = new Float64Array(totalSamples);
  const signalValues = new Float64Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = a + i * interval;
    timeValues[i] = t;
    const denom = f0 * Math.PI * t - phase;
    if (t !== 0) {
      signalValues[i] = amp * Math.sin(denom) / denom;
    } else {
      signalValues[i] = phase === 0 ? amp : amp * Math.sin(denom) / denom;
    }
    realInput[i] = signalValues[i];
  }

  const fft = new FFT(paddedSize);
  const out = fft.createComplexArray();
  fft.realTransform(out, realInput);
  fft.completeSpectrum(out);

  const center = Math.floor(paddedSize / 2);
  const rows = [];

  for (let k = 0; k < paddedSize; k++) {
    const srcIdx = fftShiftIndex(k, paddedSize);
    const reRaw = out[2 * srcIdx];
    const imRaw = out[2 * srcIdx + 1];
    const reScaled = reRaw * interval;
    const imScaled = imRaw * interval;
    const absScaled = Math.hypot(reScaled, imScaled);
    const freq = (k - center) / (paddedSize * interval);

    const inputTime = k < totalSamples ? timeValues[k] : NaN;
    const inputVal = k < totalSamples ? signalValues[k] : NaN;

    const freqRounded = roundTo(freq, 2);
    const reRounded = roundTo(reScaled, 5);
    const imRounded = roundTo(imScaled, 5);
    const absRounded = roundTo(absScaled, 5);
    const inputTimeRounded = Number.isFinite(inputTime) ? roundTo(inputTime, 5) : inputTime;
    const inputValRounded = Number.isFinite(inputVal) ? roundTo(inputVal, 5) : inputVal;

    rows.push({
      Freq: freqRounded,
      're(FFT)': reRounded,
      'im(FFT)': imRounded,
      'abs(FFT)': absRounded,
      input: inputTimeRounded,
      're(signal)': inputValRounded,
    });
  }

  return rows;
}

export async function computeFFTCos(params) {
  const a = parseFloat(params.a);
  const b = parseFloat(params.b);
  const amp = parseFloat(params.amplitude);
  const f0 = parseFloat(params.frequency);
  const phase = parseFloat(params.phase);
  const interval = parseFloat(params.interval);

  if (!(b - a > 0)) {
    throw new Error('Invalid interval: b - a must be > 0');
  }

  const totalSamples = Math.ceil((b - a) / interval) + 1;
  const paddedSize = nextPowerOfTwo(totalSamples);

  const realInput = new Float64Array(paddedSize);
  const timeValues = new Float64Array(totalSamples);
  const signalValues = new Float64Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = a + i * interval;
    timeValues[i] = t;
    signalValues[i] = amp * Math.cos(f0 * 2 * Math.PI * t - phase);
    realInput[i] = signalValues[i];
  }

  const fft = new FFT(paddedSize);
  const out = fft.createComplexArray();
  fft.realTransform(out, realInput);
  fft.completeSpectrum(out);

  const center = Math.floor(paddedSize / 2);
  const rows = [];

  for (let k = 0; k < paddedSize; k++) {
    const srcIdx = fftShiftIndex(k, paddedSize);
    const reRaw = out[2 * srcIdx];
    const imRaw = out[2 * srcIdx + 1];
    const reScaled = reRaw * interval;
    const imScaled = imRaw * interval;
    const absScaled = Math.hypot(reScaled, imScaled);
    const freq = (k - center) / (paddedSize * interval);

    const inputTime = k < totalSamples ? timeValues[k] : NaN;
    const inputVal = k < totalSamples ? signalValues[k] : NaN;

    const freqRounded = roundTo(freq, 2);
    const reRounded = roundTo(reScaled, 5);
    const imRounded = roundTo(imScaled, 5);
    const absRounded = roundTo(absScaled, 5);
    const inputTimeRounded = Number.isFinite(inputTime) ? roundTo(inputTime, 5) : inputTime;
    const inputValRounded = Number.isFinite(inputVal) ? roundTo(inputVal, 5) : inputVal;

    rows.push({
      Freq: freqRounded,
      're(FFT)': reRounded,
      'im(FFT)': imRounded,
      'abs(FFT)': absRounded,
      input: inputTimeRounded,
      're(signal)': inputValRounded,
    });
  }

  return rows;
}

