from datetime import datetime
from . import db

class MovieList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_default = db.Column(db.Boolean, default=False)
    movies = db.relationship('MovieInList', back_populates='list', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        # Filter out entries with missing movies
        valid_movies = [movie.to_dict() for movie in self.movies if movie.movie_ref is not None]
        return {
            'id': self.id,
            'name': self.name,
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat(),
            'movies': valid_movies
        }
    
    def delete_list(self):
        if self.is_default:
            raise ValueError('Cannot delete default lists')
        db.session.delete(self)
        db.session.commit()