from datetime import datetime
from . import db

class MovieInList(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.Integer, db.ForeignKey('movie.id'), nullable=False)
    list_id = db.Column(db.Integer, db.ForeignKey('movie_list.id'), nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Define relationships with back_populates
    movie_ref = db.relationship('Movie', back_populates='list_entries', lazy=True)
    list = db.relationship('MovieList', back_populates='movies', lazy=True)

    def to_dict(self):
        if not self.movie_ref:
            # If movie is missing, return minimal information
            return {
                'id': self.id,
                'movie_id': None,
                'title': None,
                'poster': None,
                'year': None,
                'added_at': self.added_at.isoformat()
            }
        
        movie_data = self.movie_ref.to_dict()
        return {
            'id': self.id,
            'movie_id': movie_data['imdb_id'],  # Use IMDB ID as movie_id
            'title': movie_data['title'],
            'poster': movie_data['poster'],
            'year': movie_data['year'],
            'added_at': self.added_at.isoformat()
        } 