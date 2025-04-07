import express, { Request, Response } from 'express';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Initialize Express
const app = express();

// In serverless environments, __dirname is not available by default
const __dirname = process.cwd();

// Middleware
app.use((req: Request, res: Response, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.send("Express API is running");
});

// FFT endpoint
app.post('/execute-fft', async (req: Request, res: Response) => {
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

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
}

// Export the Express app for Vercel
export default app;
