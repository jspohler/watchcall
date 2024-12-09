from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from . import db
from .password_reset import PasswordReset
from datetime import datetime

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_admin = db.Column(db.Boolean, default=False)
    streaming_services = db.Column(db.JSON, default=list)  # List of subscribed streaming services
    movie_lists = db.relationship('MovieList', backref='user', lazy=True, cascade='all, delete-orphan')
    reset_tokens = db.relationship('PasswordReset', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def create_reset_token(self):
        return PasswordReset.create_for_user(self)

    @staticmethod
    def verify_reset_token(token):
        reset = PasswordReset.query.filter_by(token=token, used=False).first()
        if reset and reset.is_valid():
            return reset.user
        return None 

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'is_admin': self.is_admin,
            'streaming_services': self.streaming_services or []
        } 