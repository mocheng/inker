import { genkit } from 'genkit';

const ai = genkit({
  plugins: [],
  telemetry: {
    instrumentation: 'genkit',
    logger: 'genkit'
  },
  enableTracingAndMetrics: true
});

// Keep process alive
setInterval(() => {}, 1000);

console.log('Genkit telemetry receiver started');
console.log('Genkit UI: http://localhost:4000');
console.log('Waiting for telemetry data...');
