from datetime import datetime
from . import db

class StreamingAvailability(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.String(20), nullable=False)  # IMDB ID
    service = db.Column(db.String(50), nullable=False)  # e.g., 'Netflix', 'Disney+', etc.
    available_from = db.Column(db.DateTime, nullable=True)
    available_until = db.Column(db.DateTime, nullable=True)
    region = db.Column(db.String(10), nullable=False, default='DE')  # Country code
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    added_by_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'movie_id': self.movie_id,
            'service': self.service,
            'available_from': self.available_from.isoformat() if self.available_from else None,
            'available_until': self.available_until.isoformat() if self.available_until else None,
            'region': self.region,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 