from datetime import datetime, timedelta
import secrets
from . import db

class PasswordReset(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    token = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)

    @staticmethod
    def generate_token():
        return secrets.token_urlsafe(32)

    @staticmethod
    def create_for_user(user):
        # Expire any existing tokens
        PasswordReset.query.filter_by(
            user_id=user.id, 
            used=False
        ).update({"used": True})
        db.session.commit()

        # Create new token
        token = PasswordReset.generate_token()
        reset = PasswordReset(
            user_id=user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )
        db.session.add(reset)
        db.session.commit()
        return reset

    def is_valid(self):
        return (
            not self.used and 
            self.expires_at > datetime.utcnow()
        ) 