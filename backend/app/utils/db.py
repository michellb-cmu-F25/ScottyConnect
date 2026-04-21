"""
Database access (singleton). Wraps PyMongo client and database handle.
"""

import os

import certifi
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

_instance: "Database | None" = None


class Database:
    """Thin holder for MongoClient and the selected database."""

    def __init__(self) -> None:
        uri = os.getenv("MONGO_URI")
        name = os.getenv("MONGO_DB")
        if not uri or not name:
            raise ValueError("MONGO_URI and MONGO_DB must be set in the environment")
        self.client = MongoClient(uri, tlsCAFile=certifi.where())
        self.db = self.client[name]


def get_database() -> Database:
    global _instance
    if _instance is None:
        _instance = Database()
    return _instance


def to_domain_model(doc: dict | None, model_cls):
    """
    Standard utility to convert a MongoDB document to a Pydantic domain model.
    Maps '_id' to 'id' and handles None documents.
    """
    if doc is None:
        return None
    payload = dict(doc)
    oid = payload.pop("_id", None)
    if oid is not None:
        payload["id"] = str(oid)
    return model_cls.model_validate(payload)
