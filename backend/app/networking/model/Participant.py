"""
Participant Model
Defines the Colleagues in the Mediator pattern (Student and Alumni).
"""

from abc import ABC, abstractmethod
from typing import List, Protocol

from pydantic import BaseModel


class ICoffeeChatMediator(Protocol):
    """Mediator interface to avoid circular dependencies."""
    def send_invite(self, sender: 'Participant', receiver_id: str, timeslot: str) -> bool:
        ...
    def respond_to_invite(self, responder: 'Participant', invite_id: str, accept: bool) -> bool:
        ...


class Participant(BaseModel, ABC):
    """Abstract base class for all coffee chat participants."""
    user_id: str
    username: str
    
    # Injected mediator (private attribute to avoid Pydantic validation issues)
    _mediator: ICoffeeChatMediator | None = None
    
    def set_mediator(self, mediator: ICoffeeChatMediator):
        """Inject the mediator instance."""
        self._mediator = mediator

    @abstractmethod
    def get_role(self) -> str:
        """Return the participant's specific role."""
        pass

    def send_invite(self, receiver_id: str, timeslot: str) -> bool:
        """Delegate invitation sending to the mediator."""
        if self._mediator:
            return self._mediator.send_invite(self, receiver_id, timeslot)
        return False


class StudentAttendee(Participant):
    """Concrete Participant representing a Student."""
    def get_role(self) -> str:
        return "STUDENT"


class AlumniAttendee(Participant):
    """Concrete Participant representing an Alumni."""
    def get_role(self) -> str:
        return "ALUMNI"


class ParticipantFactory:
    """Factory to create participants based on system roles."""
    
    _ROLE_MAP = {
        "STUDENT": StudentAttendee,
        "ALUMNI": AlumniAttendee
    }

    @staticmethod
    def create(user_id: str, username: str, role: str) -> Participant:
        """Creates the appropriate Participant subclass for a given role."""
        cls = ParticipantFactory._ROLE_MAP.get(role, AlumniAttendee)
        return cls(user_id=user_id, username=username)
