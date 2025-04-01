import { loadJSONToIndexedDB } from './db.js';

// Fetch last used signal parameters from the server
let signalParamsOnReload;
try {
  const response = await fetch('http://localhost:3000/signal-params');
  if (response.ok) {
    signalParamsOnReload = await response.json();
    console.log("Loaded parameters from server:", signalParamsOnReload);
  } else {
    throw new Error(`Failed to fetch params: ${response.status}`);
  }
} catch (error) {
  console.error("Error fetching signal parameters:", error);
  // Fallback to default parameters if API call fails
  signalParamsOnReload = {
    a: -30,
    b: 30,
    signalShape: 'sinc',
    amplitude: 1,
    frequency: 1,
    phase: 0,
    interval: 0.01,
    freqrange: 5
  };
}

// Get the input elements
const shapeInput = document.getElementById('signalShape');
const freqLabelInput = document.getElementById('freqLabel');

const intervalInput = document.getElementById('interval');
const freqRangeInput = document.getElementById('freqrange');
const freqRangeLabelInput = document.getElementById('freqRangeLabel');

function updateFreqLabel() {
    switch (true) {
        case shapeInput.value === "square":
            freqLabelInput.textContent = "Duration (T):";
            break;
        case shapeInput.value === "triangle":
            freqLabelInput.textContent = "Duration (2T):";
            break;
        default:
            freqLabelInput.textContent = "Frequency (f₀):";
    }
}

function updateDynamicMax() {
    // Get the current interval value (as a number)
    const currentInterval = parseFloat(intervalInput.value);
    // Assume you calculate total_samples from other inputs, for example:
    const a = parseFloat(document.getElementById('a').value);
    const b = parseFloat(document.getElementById('b').value);
    const total_samples = Math.ceil((b - a) / currentInterval);
    
    // Calculate your dynamic max (use your formula here)
    const dynamicMax = Math.floor(10*(total_samples - Math.round(total_samples/2))/(total_samples * currentInterval)) / 10;
                    
    // Update the max attribute and current value if needed
    freqRangeInput.setAttribute('max', dynamicMax);
    freqRangeLabelInput.textContent = `Hz range <= ${dynamicMax}:`;
    if (parseFloat(freqRangeInput.value) > dynamicMax) {
        freqRangeInput.value = dynamicMax;
    }
}

// Attach an event listener to update when the interval value changes
intervalInput.addEventListener('input', updateDynamicMax);
shapeInput.addEventListener('input', updateFreqLabel);

// Optionally, you might also want to update when the a or b inputs change
document.getElementById('a').addEventListener('input', updateDynamicMax);
document.getElementById('b').addEventListener('input', updateDynamicMax);

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


window.addEventListener('DOMContentLoaded', async (event) => {
    updateDynamicMax(); // on load
    updateFreqLabel(); // on load
});

signalForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the default form submission (and redirect)
    
    const signalForm = document.getElementById('signalForm');
    const formParams = new FormData(signalForm);
    const signalParams = Object.fromEntries(formParams.entries());


    console.log("Form submitted:", signalParams);
    transformSignal(signalParams);
});
