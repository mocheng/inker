#!/usr/bin/env python3
"""Main entry point for inker-py CLI."""

import sys


def main() -> None:
    """Main entry point."""
    # Import telemetry first to initialize tracing
    from ..telemetry import shutdown

    try:
        from .app import run_app

        run_app()
    except KeyboardInterrupt:
        pass
    finally:
        # Shutdown telemetry
        shutdown()


if __name__ == "__main__":
    main()
