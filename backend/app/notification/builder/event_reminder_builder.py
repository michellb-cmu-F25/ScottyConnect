"""
Event Reminder Email Builder
"""

from app.notification.builder.base_builder import EmailBuilder
from app.notification.model.Email import Email
from app.bus.message import Message
from app.bus.message import MessageType

class EventReminderBuilder(EmailBuilder):
    def __init__(self, message: Message):
        # Check message type is EVENT_REMINDER
        if message.get_type() != MessageType.EVENT_REMINDER:
            raise ValueError("System Error:Message type is not EVENT_REMINDER")
        super().__init__(message)
        
    def fill_template(self):
        self.body = self.template.format(
            event_date=self.message.data["event_date"],
            event_time=self.message.data["event_time"],
            event_info=self.message.data["event_info"]
        )
        
    def build(self) -> Email:
        self.fill_template()
        return super().build()