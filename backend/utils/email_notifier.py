import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class EmailNotifier:
    _instance = None
    _last_notification_sent = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmailNotifier, cls).__new__(cls)
            cls._instance._init_config()
        return cls._instance

    def _init_config(self):
        self.smtp_server = os.getenv('SMTP_SERVER')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.username = os.getenv('SMTP_USERNAME')
        self.password = os.getenv('SMTP_PASSWORD')
        self.notification_email = os.getenv('NOTIFICATION_EMAIL')
        
        # Validate configuration
        if not all([self.smtp_server, self.smtp_port, self.username, 
                   self.password, self.notification_email]):
            logger.error("Email configuration is incomplete. Notifications will not be sent.")

    def send_email(self, subject, recipient, body):
        """
        Send a general email to any recipient.
        """
        if not all([self.smtp_server, self.smtp_port, self.username, self.password]):
            raise ValueError("Email configuration is incomplete")

        try:
            msg = MIMEMultipart()
            msg['From'] = self.username
            msg['To'] = recipient
            msg['Subject'] = subject

            msg.attach(MIMEText(body, 'plain'))

            # Connect to SMTP server
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.username, self.password)

            # Send email
            server.send_message(msg)
            server.quit()

            logger.info(f"Email sent successfully to {recipient}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            raise

    def send_scraping_failure_notification(self, error_message):
        """
        Send a notification about scraping failure.
        Only sends one notification per day to avoid spam.
        """
        # Check if we already sent a notification today
        today = datetime.now().date()
        if (self._last_notification_sent and 
            self._last_notification_sent.date() == today):
            logger.info("Already sent a notification today, skipping.")
            return

        try:
            self.send_email(
                subject="WatchCall: Streaming Scraper Failure",
                recipient=self.notification_email,
                body=f"""
                The streaming availability scraper has encountered an error.
                This might indicate that the website structure has changed.

                Error details:
                {error_message}

                Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

                Please check the scraper implementation and update it as needed.
                """
            )
            # Update last notification time
            self._last_notification_sent = datetime.now()
            logger.info("Scraping failure notification sent successfully.")

        except Exception as e:
            logger.error(f"Failed to send notification email: {str(e)}")

# Create a singleton instance
notifier = EmailNotifier() 