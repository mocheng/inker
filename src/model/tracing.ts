import { trace, Span, context } from '@opentelemetry/api';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

export function getTracer() {
  return trace.getTracer('inker');
}

export function getLogger() {
  return logs.getLogger('inker');
}

/**
 * Log severity levels mapped to OpenTelemetry SeverityNumber
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const severityMap: Record<LogLevel, SeverityNumber> = {
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
};

/**
 * Emits a log record correlated with the current active span.
 * The log will automatically include trace_id and span_id from the active context.
 * 
 * @param level - The log severity level
 * @param message - The log message body
 * @param attributes - Optional attributes to attach to the log record
 */
export function logWithSpanCorrelation(
  level: LogLevel,
  eventName: string,
  message: string,
  attributes?: Record<string, string | number | boolean>
): void {
  const logger = getLogger();
  const activeSpan = trace.getActiveSpan();
  const activeContext = context.active();
  
  // Build attributes including span correlation info
  const logAttributes: Record<string, string | number | boolean> = {
    'event.name': eventName,
    ...attributes,
  };
  
  // Add span context information if available
  if (activeSpan) {
    const spanContext = activeSpan.spanContext();
    logAttributes['trace_id'] = spanContext.traceId;
    logAttributes['span_id'] = spanContext.spanId;
  }
  
  logger.emit({
    eventName,
    severityNumber: severityMap[level],
    severityText: level.toUpperCase(),
    body: message,
    attributes: logAttributes,
    context: activeContext,
  });
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
