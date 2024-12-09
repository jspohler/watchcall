from datetime import datetime
from . import db

class Movie(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    imdb_id = db.Column(db.String(20), unique=True, nullable=False)  # IMDB ID
    title = db.Column(db.String(200), nullable=False)
    poster = db.Column(db.String(500))
    year = db.Column(db.String(10))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Define relationship with MovieInList
    list_entries = db.relationship('MovieInList', back_populates='movie_ref', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'imdb_id': self.imdb_id,
            'title': self.title,
            'poster': self.poster,
            'year': self.year,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        } 