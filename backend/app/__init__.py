from flask import Flask
from flask_cors import CORS

from app.accounts.service import ACCOUNT_SERVICE_EXTENSION_KEY, AccountService


def create_app():
    app = Flask(__name__)
    CORS(app)

    # Register each service as an extension for subscriber-publisher pattern
    app.extensions[ACCOUNT_SERVICE_EXTENSION_KEY] = AccountService()
    # app.extensions[ATTENDANCE_SERVICE_EXTENSION_KEY] = AttendanceService()
    # app.extensions[NOTIFICATION_SERVICE_EXTENSION_KEY] = NotificationService()
    # app.extensions[FEEDBACK_SERVICE_EXTENSION_KEY] = FeedbackService()
    # app.extensions[LIFECYCLE_SERVICE_EXTENSION_KEY] = LifecycleService()
    # app.extensions[NETWORKING_SERVICE_EXTENSION_KEY] = NetworkingService()
    # app.extensions[TASKS_SERVICE_EXTENSION_KEY] = TasksService()

    from .routes import main

    app.register_blueprint(main)

    return app