import argparse
import logging
import os

from app import create_app
from app.notification.service import NOTIFICATION_SERVICE_EXTENSION_KEY

def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run ScottyConnect backend server")
    parser.add_argument(
        "--info",
        action="store_true",
        help="Enable INFO level logging",
    )
    return parser.parse_args()


def _configure_logging(enable_info: bool) -> None:
    level = logging.INFO if enable_info else logging.WARNING
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )


if __name__ == "__main__":
    args = _parse_args()
    _configure_logging(args.info)
    app = create_app()
    is_reloader_child = os.environ.get("WERKZEUG_RUN_MAIN") == "true"
    if is_reloader_child:
        app.extensions[NOTIFICATION_SERVICE_EXTENSION_KEY].start_worker()
    app.run(debug=True)