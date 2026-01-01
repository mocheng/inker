import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  serviceName: 'inker',
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4033/api/otlp',
  }),
});

sdk.start();

export { sdk };
