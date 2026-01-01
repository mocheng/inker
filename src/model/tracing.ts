import { trace, Span } from '@opentelemetry/api';

export function getTracer() {
  return trace.getTracer('inker');
}

export async function withSpan<T>(
  name: string,
  attributes: Record<string, any>,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, async (span) => {
    try {
      for (const [key, value] of Object.entries(attributes)) {
        span.setAttribute(key, typeof value === 'object' ? JSON.stringify(value) : value);
      }
      const result = await fn(span);
      span.setStatus({ code: 1 });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: 2, message: (error as Error).message });
      throw error;
    } finally {
      span.end();
    }
  });
}
