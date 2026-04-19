from flask import Blueprint, jsonify, request

from app.tasks.schemas import (
    CreateTaskRequest,
    UpdateTaskRequest,
    ContributeRequest,
    TaskResponse,
    TaskTreeResponse,
)
from app.tasks.service import get_tasks_service
from app.utils.doc import doc
from app.utils.validate import validate

tasks = Blueprint("tasks", __name__)


def _user_id() -> str | None:
    # TODO: Replace with actual authentication mechanism (JWT) once implemented
    # Extract user identifier from request header 
    # Placeholder for JWT
    return request.headers.get("X-User-Id")


def _event_ctx() -> dict:
    # Extract optional event-context headers supplied by the frontend for events that live only in localStorage and not yet in MongoDB)
    return {
        "fallback_owner_id": request.headers.get("X-Event-Owner-Id"),
        "fallback_status": request.headers.get("X-Event-Status"),
    }


@tasks.route("/events/<event_id>", methods=["POST"])
@validate(CreateTaskRequest)
@doc(
    request=CreateTaskRequest,
    response=TaskResponse,
    description="Create a new task (or sub-task) for an event",
    tags=["tasks"],
    success_status=201,
)
def create_task(req: CreateTaskRequest, event_id: str):
    uid = _user_id()

    if not uid:
        return jsonify({"message": "Missing X-User-Id header"}), 401
    resp = get_tasks_service().create_task(
        event_id, req.title, req.description, req.parent_id, uid, **_event_ctx()
    )

    return jsonify(resp.model_dump(mode="json")), resp.code


@tasks.route("/events/<event_id>", methods=["GET"])
@doc(
    response=TaskTreeResponse,
    description="Get the full task tree for an event",
    tags=["tasks"],
    success_status=200,
)
def get_task_tree(event_id: str):
    uid = _user_id() or ""
    resp = get_tasks_service().get_task_tree(event_id, uid, **_event_ctx())

    return jsonify(resp.model_dump(mode="json")), resp.code


@tasks.route("/<task_id>", methods=["PUT"])
@validate(UpdateTaskRequest)
@doc(
    request=UpdateTaskRequest,
    response=TaskResponse,
    description="Update a task's title or description",
    tags=["tasks"],
    success_status=200,
)
def update_task(req: UpdateTaskRequest, task_id: str):
    uid = _user_id()
    if not uid:
        return jsonify({"message": "Missing X-User-Id header"}), 401

    resp = get_tasks_service().update_task(
        task_id, uid, req.title, req.description, **_event_ctx()
    )

    return jsonify(resp.model_dump(mode="json")), resp.code


@tasks.route("/<task_id>", methods=["DELETE"])
@doc(
    response=TaskResponse,
    description="Delete a task and all its sub-tasks",
    tags=["tasks"],
    success_status=200,
)
def delete_task(task_id: str):
    uid = _user_id()
    if not uid:
        return jsonify({"message": "Missing X-User-Id header"}), 401

    resp = get_tasks_service().delete_task(task_id, uid, **_event_ctx())

    return jsonify(resp.model_dump(mode="json")), resp.code


@tasks.route("/<task_id>/claim", methods=["POST"])
@doc(
    response=TaskResponse,
    description="Claim an open task",
    tags=["tasks"],
    success_status=200,
)
def claim_task(task_id: str):
    uid = _user_id()
    if not uid:
        return jsonify({"message": "Missing X-User-Id header"}), 401

    resp = get_tasks_service().claim_task(task_id, uid, **_event_ctx())

    return jsonify(resp.model_dump(mode="json")), resp.code


@tasks.route("/<task_id>/claim", methods=["DELETE"])
@doc(
    response=TaskResponse,
    description="Unclaim a claimed task",
    tags=["tasks"],
    success_status=200,
)
def unclaim_task(task_id: str):
    uid = _user_id()
    if not uid:
        return jsonify({"message": "Missing X-User-Id header"}), 401

    resp = get_tasks_service().unclaim_task(task_id, uid, **_event_ctx())

    return jsonify(resp.model_dump(mode="json")), resp.code


@tasks.route("/<task_id>/contribute", methods=["POST"])
@validate(ContributeRequest)
@doc(
    request=ContributeRequest,
    response=TaskResponse,
    description="Submit a contribution for a claimed task",
    tags=["tasks"],
    success_status=200,
)
def contribute_task(req: ContributeRequest, task_id: str):
    uid = _user_id()
    if not uid:
        return jsonify({"message": "Missing X-User-Id header"}), 401

    resp = get_tasks_service().contribute(
        task_id, uid, req.contribution, **_event_ctx()
    )
    
    return jsonify(resp.model_dump(mode="json")), resp.code
