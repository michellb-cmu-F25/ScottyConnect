from flask import Blueprint, jsonify, render_template_string

from app.utils.openapi_generator import generate_openapi_spec

main = Blueprint("main", __name__)

@main.route("/api/health")
def health():
    return jsonify({"message": "ok"})

@main.route("/api/sentry-debug")
def sentry_debug():
    raise Exception("Test Sentry Error")


@main.route("/openapi.json", methods=["GET"])
def openapi_json():
    return jsonify(generate_openapi_spec())


@main.route("/docs", methods=["GET"])
def docs():
    return render_template_string(
        """
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>ScottyConnect API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        SwaggerUIBundle({
          url: "/openapi.json",
          dom_id: "#swagger-ui"
        });
      };
    </script>
  </body>
</html>
        """
    )


# Subroutes for each service
from app.accounts.routes import accounts
main.register_blueprint(accounts, url_prefix="/api/accounts")

from app.lifecycle.routes import lifecycle
main.register_blueprint(lifecycle, url_prefix="/api/lifecycle")

# TODO: Add subroutes for each service here.