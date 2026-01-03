"""OpenTelemetry setup for inker-py.

Environment variables:
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT - Trace endpoint (full URL including path)
  OTEL_EXPORTER_OTLP_ENDPOINT        - Base endpoint (fallback, /v1/traces appended)

JAEGER (default):
  1. Start Jaeger:
     docker run -d --rm --name jaeger \
       -p 16686:16686 -p 4317:4317 -p 4318:4318 \
       jaegertracing/jaeger:2.13.0

  2. Run inker (uses Jaeger by default):
     inker

  3. View traces: http://localhost:16686

GENKIT UI:
  1. Start Genkit dev server:
     cd genkit && npm run dev

  2. Run inker with Genkit endpoint:
     OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4033/api/otlp inker

  3. View traces: http://localhost:4000
"""

import os

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource

# Default to Jaeger OTLP HTTP endpoint
DEFAULT_ENDPOINT = "http://localhost:4318"

# Get trace endpoint from environment
base_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", DEFAULT_ENDPOINT)
traces_endpoint = os.getenv(
    "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT", f"{base_endpoint}/v1/traces"
)

# Create resource
resource = Resource.create({"service.name": "inker-py"})

# Create tracer provider
provider = TracerProvider(resource=resource)

# Create and add exporter
exporter = OTLPSpanExporter(endpoint=traces_endpoint)
processor = BatchSpanProcessor(exporter)
provider.add_span_processor(processor)

# Set global tracer provider
trace.set_tracer_provider(provider)


def get_tracer() -> trace.Tracer:
    """Get the tracer for inker-py."""
    return trace.get_tracer("inker-py")


def shutdown() -> None:
    """Shutdown the tracer provider."""
    provider.shutdown()
