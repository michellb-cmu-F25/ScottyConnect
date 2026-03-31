from enum import Enum
import json

"""
Enum class to represent the types of messages in the message bus.
"""
class MessageType(Enum):
    # Message for user registration success, should submit request to send verification email.
    REGISTER_MESSAGE = "REGISTER_MESSAGE"
    
    # TODO: Edit to use your own message types, these are just examples.
    ATTENDANCE_MESSAGE = "ATTENDANCE_MESSAGE"
    FEEDBACK_MESSAGE = "FEEDBACK_MESSAGE"
    LIFECYCLE_MESSAGE = "LIFECYCLE_MESSAGE"
    NETWORKING_MESSAGE = "NETWORKING_MESSAGE"
    TASKS_MESSAGE = "TASKS_MESSAGE"

class Message:
    """
    Message class to represent a message in the message bus.
    """
    def __init__(self, type: MessageType, data: dict):
        self.type = type
        self.data = data
    
    def __str__(self):
        return f"Message(type={self.type.value}, data={json.dumps(self.data)})"

    def get_type(self) -> MessageType:
        return self.type
    
    def get_data(self) -> dict:
        return self.data