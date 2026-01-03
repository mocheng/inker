"""Tracing utilities for inker-py."""

import json
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator, TypeVar, Callable, Awaitable

from opentelemetry import trace
from opentelemetry.trace import Span, StatusCode

from ..telemetry import get_tracer

T = TypeVar("T")


@asynccontextmanager
async def with_span(
    name: str,
    attributes: dict[str, Any] | None = None,
) -> AsyncGenerator[Span, None]:
    """Context manager for creating a traced span.

    Args:
        name: Name of the span
        attributes: Optional attributes to set on the span

    Yields:
        The active span
    """
    tracer = get_tracer()

    with tracer.start_as_current_span(name) as span:
        try:
            # Set attributes
            if attributes:
                for key, value in attributes.items():
                    if isinstance(value, (dict, list)):
                        span.set_attribute(key, json.dumps(value))
                    else:
                        span.set_attribute(key, value)

            yield span

            span.set_status(StatusCode.OK)
        except Exception as e:
            span.record_exception(e)
            span.set_status(StatusCode.ERROR, str(e))
            raise


async def traced(
    name: str,
    attributes: dict[str, Any] | None = None,
) -> Callable[[Callable[..., Awaitable[T]]], Callable[..., Awaitable[T]]]:
    """Decorator for tracing async functions.

    Args:
        name: Name of the span
        attributes: Optional attributes to set on the span

    Returns:
        Decorated function
    """

    def decorator(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        async def wrapper(*args: Any, **kwargs: Any) -> T:
            async with with_span(name, attributes) as span:
                result = await func(*args, **kwargs)
                return result

        return wrapper

    return decorator
