import express from 'express';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { readFile } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // adjust origin as needed
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.post('/execute-fft', async (req, res) => {
  const { a, b, signalShape, amplitude, frequency, phase, interval } = req.body;

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

app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
