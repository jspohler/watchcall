from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User
from .movie import Movie
from .movie_list import MovieList
from .movie_in_list import MovieInList
from .streaming_availability import StreamingAvailability
from .password_reset import PasswordReset 