"""
Email Templates
"""

from enum import Enum
from textwrap import dedent

from app.notification.model.Email import EmailType
from app.bus.message import MessageType

class EmailTemplate:
    def __init__(self, template: str, subject: str, email_type: EmailType):
        self.template = dedent(template).strip()
        self.subject = subject 
        self.email_type = email_type

class EmailTemplates(Enum):
    VERIFICATION = EmailTemplate(
        """
        ScottyConnect Account Verification
        Welcome to ScottyConnect!
        Your verification code is: {verification_code}

        Enter this code in the app to verify your email address and complete setup.
        If you did not request this verification, you can safely ignore this message.
        """,
        "ScottyConnect Account Verification",
        EmailType.VERIFICATION,
    )
    EVENT_REGISTRATION_CONFIRMATION = EmailTemplate(
        """
        ScottyConnect Event Registration Confirmation
        You are officially registered for:

        {event_info}

        We are excited to have you join.
        You can review event details and updates anytime in the My Events page.
        If your plans change, please cancel early so another attendee can take your spot.
        """,
        "ScottyConnect Event Registration Confirmation",
        EmailType.EVENT_REGISTRATION_CONFIRMATION,
    )

    EVENT_REGISTRATION_CANCELLED = EmailTemplate(
        """
        ScottyConnect Event Registration Cancellation
        We are sorry to share that you have been unregistered from:
       
        {event_info}

        No further action is required from you.
        Please check the app for replacement sessions or related events.
        Thank you for your understanding.
        """,
        "ScottyConnect Event Registration Cancellation",
        EmailType.EVENT_REGISTRATION_CANCELLED,
    )

    EVENT_REMINDER = EmailTemplate(
        """
        ScottyConnect Event Reminder
        This is a reminder for your upcoming event that is scheduled for {event_date} at {event_time}:
        
        {event_info}

        Please double-check the event details in the app before attending.
        Arrive a few minutes early to make check-in smooth.
        We look forward to seeing you there.
        """,
        "ScottyConnect Event Reminder",
        EmailType.EVENT_REMINDER,
    )
    EVENT_CANCELLED = EmailTemplate(
        """
        ScottyConnect Event Cancellation Notice
        We are sorry to share that the following event has been cancelled:
        
        {event_info}

        No further action is required from you.
        Please check the app for replacement sessions or related events.
        Thank you for your understanding.
        """,
        "ScottyConnect Event Cancellation Notice",
        EmailType.EVENT_CANCELLED,
    )
    EVENT_UPDATED = EmailTemplate(
        """
        ScottyConnect Event Update
        There are new changes to one of your events!

        Previous information:
        
        {previous_event_info}

        New event information:
        
        {updated_event_info}

        Please open the event in the app to review the latest schedule and details.
        If the update affects your availability, you can manage your registration there.
        """,
        "ScottyConnect Event Update",
        EmailType.EVENT_UPDATED,
    )

    ATTENDANCE_RECORDED = EmailTemplate(
        """
        ScottyConnect Attendance Confirmation
        Your attendance has been recorded successfully for:
        
        {event_info}

        Thanks for participating.
        Keep attending events to build your activity history and stay engaged with the community.
        """,
        "ScottyConnect Attendance Confirmation",
        EmailType.ATTENDANCE_RECORDED,
    )

    @staticmethod
    def message_type_to_email_template(message_type: MessageType) -> EmailTemplate:
        match message_type:
            case MessageType.REGISTER_MESSAGE:
                return EmailTemplates.VERIFICATION.value
            case MessageType.EVENT_REGISTRATION_CONFIRMATION:
                return EmailTemplates.EVENT_REGISTRATION_CONFIRMATION.value
            case MessageType.EVENT_REGISTRATION_CANCELLED:
                return EmailTemplates.EVENT_REGISTRATION_CANCELLED.value
            case MessageType.EVENT_REMINDER:
                return EmailTemplates.EVENT_REMINDER.value
            case MessageType.EVENT_CANCELLED:
                return EmailTemplates.EVENT_CANCELLED.value    
            case MessageType.EVENT_UPDATED:
                return EmailTemplates.EVENT_UPDATED.value
            case MessageType.ATTENDANCE_RECORDED:
                return EmailTemplates.ATTENDANCE_RECORDED.value
            case _:
                raise ValueError(f"Invalid message type: {message_type}")