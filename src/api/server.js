import express from 'express';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { writeFile, readFile } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Store the most recent signal parameters
let lastSignalParams = null;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // adjust origin as needed
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Path to store the last parameters as a JSON file (more persistent than in-memory)
const lastParamsFilePath = path.join(__dirname, 'last_params.json');

// Helper function to save parameters to a file
async function saveParamsToFile(params) {
  try {
    await writeFile(lastParamsFilePath, JSON.stringify(params, null, 2));
  } catch (err) {
    console.error("Error saving parameters to file:", err);
  }
}

// Helper function to read parameters from file
async function readParamsFromFile() {
  try {
    const data = await readFile(lastParamsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading parameters from file:", err);
    return null;
  }
}

app.post('/execute-fft', async (req, res) => {
  const { a, b, signalShape, amplitude, frequency, phase, interval } = req.body;

  // Store the parameters both in memory and in a file
  lastSignalParams = req.body;
  await saveParamsToFile(lastSignalParams);

  const args = [
    a,
    b,
    signalShape,
    amplitude,
    frequency,
    phase,
    interval,
  ];

  execFile('node', ['execute-fft.js', ...args], async (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error}`);
      return res.status(500).send('Error executing script');
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);

    try {
      // Adjust the file path if your JSON is output elsewhere.
      const jsonFilePath = path.join(__dirname, 'fft_out.json');
      const jsonData = await readFile(jsonFilePath, 'utf-8');
      const outputData = JSON.parse(jsonData);
      // Return the JSON data as response
      res.json(outputData);
    } catch (err) {
      console.error("Error reading JSON file", err);
      res.status(500).send('Error reading FFT output file');
    }
  });
});

// New GET endpoint to retrieve the last used signal parameters
app.get('/signal-params', async (req, res) => {
  try {
    // First try to get from memory
    if (lastSignalParams) {
      return res.json(lastSignalParams);
    }
    
    // If not in memory, try to read from file
    const fileParams = await readParamsFromFile();
    if (fileParams) {
      return res.json(fileParams);
    }
    
    // If neither exists, return a default set of parameters
    return res.json({
      a: -30,
      b: 30,
      signalShape: 'sinc',
      amplitude: 1,
      frequency: 1,
      phase: 0,
      interval: 0.01,
      freqrange: 5
    });
  } catch (error) {
    console.error("Error retrieving signal parameters:", error);
    res.status(500).send('Error retrieving signal parameters');
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
