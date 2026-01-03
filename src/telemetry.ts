import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { logs } from '@opentelemetry/api-logs';
import { resourceFromAttributes } from '@opentelemetry/resources';

/**
 * OpenTelemetry Tracing & Logging Configuration
 * 
 * Environment variables:
 *   OTEL_EXPORTER_OTLP_TRACES_ENDPOINT - Trace endpoint (full URL including path)
 *   OTEL_EXPORTER_OTLP_LOGS_ENDPOINT   - Logs endpoint (full URL including path)
 *   OTEL_EXPORTER_OTLP_ENDPOINT        - Base endpoint (fallback, /v1/traces or /v1/logs appended)
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * JAEGER (default)
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Start Jaeger:
 *    docker run -d --rm --name jaeger \
 *      -p 16686:16686 -p 4317:4317 -p 4318:4318 \
 *      jaegertracing/jaeger:2.13.0
 * 
 * 2. Run inker (uses Jaeger by default):
 *    npm start
 * 
 * 3. View traces: http://localhost:16686
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 * GENKIT UI
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Start Genkit dev server:
 *    cd genkit && npm run dev
 * 
 * 2. Run inker with Genkit endpoint:
 *    OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4033/api/otlp npm start
 * 
 * 3. View traces: http://localhost:4000
 *    - Genkit shows traces with Input/Output/Context tabs
 * 
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Default to Jaeger OTLP HTTP endpoint
const DEFAULT_ENDPOINT = 'http://localhost:4318';

// Get endpoints from environment
const baseEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || DEFAULT_ENDPOINT;
const tracesEndpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || `${baseEndpoint}/v1/traces`;
const logsEndpoint = process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT || `${baseEndpoint}/v1/logs`;

// Create shared resource for service identification
const resource = resourceFromAttributes({
  'service.name': 'inker',
});

// Setup LoggerProvider with OTLP export
const logExporter = new OTLPLogExporter({ url: logsEndpoint });
const logProcessor = new BatchLogRecordProcessor(logExporter);
const loggerProvider = new LoggerProvider({
  resource,
  processors: [logProcessor],
});

// Register the global logger provider
logs.setGlobalLoggerProvider(loggerProvider);

// Setup NodeSDK for traces
const sdk = new NodeSDK({
  serviceName: 'inker',
  traceExporter: new OTLPTraceExporter({ url: tracesEndpoint }),
});

sdk.start();

export { sdk, loggerProvider };
