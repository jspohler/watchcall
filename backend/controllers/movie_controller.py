from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from models import db, Movie, MovieList, MovieInList
import os
import requests

movie_bp = Blueprint('movie', __name__)

OMDB_API_KEY = os.getenv('OMDB_API_KEY')
OMDB_BASE_URL = 'http://www.omdbapi.com/'

def get_omdb_data(params):
    try:
        params['apikey'] = OMDB_API_KEY
        response = requests.get(OMDB_BASE_URL, params=params)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"OMDB API error: {str(e)}")
        return None

def cleanup_orphaned_entries():
    """Remove MovieInList entries that point to non-existent movies."""
    try:
        # Find all MovieInList entries where the movie doesn't exist
        orphaned = MovieInList.query.filter(
            ~MovieInList.movie_id.in_(
                db.session.query(Movie.id)
            )
        ).all()
        
        # Delete orphaned entries
        for entry in orphaned:
            db.session.delete(entry)
        
        db.session.commit()
        print(f"Cleaned up {len(orphaned)} orphaned movie entries")
    except Exception as e:
        print(f"Error during cleanup: {str(e)}")
        db.session.rollback()

@movie_bp.route('/movies/search', methods=['GET'])
@login_required
def search_movies():
    query = request.args.get('query')
    if not query:
        return jsonify([])
    
    data = get_omdb_data({'s': query, 'type': 'movie'})
    if not data or 'Search' not in data:
        return jsonify([])
    
    return jsonify(data['Search'])

@movie_bp.route('/movies/<imdb_id>', methods=['GET'])
@login_required
def get_movie_details(imdb_id):
    data = get_omdb_data({'i': imdb_id})
    if not data or 'Error' in data:
        return jsonify({'error': 'Movie not found'}), 404
    
    return jsonify(data)

@movie_bp.route('/movie-lists', methods=['GET'])
@login_required
def get_movie_lists():
    try:
        # Clean up orphaned entries before returning lists
        cleanup_orphaned_entries()
        
        lists = MovieList.query.filter_by(user_id=current_user.id).order_by(
            MovieList.is_default.desc(),
            MovieList.created_at.asc()
        ).all()
        result = [lst.to_dict() for lst in lists]
        print(f"Found {len(result)} lists: {[lst['name'] for lst in result]}")
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@movie_bp.route('/movie-lists', methods=['POST'])
@login_required
def create_movie_list():
    data = request.get_json()
    name = data.get('name')
    
    if not name:
        return jsonify({'error': 'Name is required'}), 400
        
    if MovieList.query.filter_by(user_id=current_user.id, name=name).first():
        return jsonify({'error': 'A list with this name already exists'}), 400
    
    movie_list = MovieList(name=name, user_id=current_user.id)
    db.session.add(movie_list)
    db.session.commit()
    
    return jsonify(movie_list.to_dict()), 201

@movie_bp.route('/movie-lists/<int:list_id>/movies', methods=['POST'])
@login_required
def add_movie_to_list(list_id):
    movie_list = MovieList.query.get_or_404(list_id)
    
    # Check if user owns this list
    if movie_list.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    if not data or not all(k in data for k in ('movieId', 'title')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # First, check if movie exists in database
    movie = Movie.query.filter_by(imdb_id=data['movieId']).first()
    
    if not movie:
        # Create new movie entry
        movie = Movie(
            imdb_id=data['movieId'],
            title=data['title'],
            poster=data.get('poster'),
            year=data.get('year')
        )
        db.session.add(movie)
        db.session.flush()  # Get the movie ID without committing
    
    # Check if movie already in list
    existing_entry = MovieInList.query.filter_by(
        list_id=list_id, 
        movie_id=movie.id
    ).first()
    
    if existing_entry:
        return jsonify({'error': 'Movie already in list'}), 400
    
    # Create new list entry
    movie_in_list = MovieInList(
        movie_id=movie.id,
        list_id=list_id
    )
    
    try:
        db.session.add(movie_in_list)
        db.session.commit()
        return jsonify(movie_in_list.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@movie_bp.route('/movie-lists/<int:list_id>/movies/<string:imdb_id>', methods=['DELETE'])
@login_required
def remove_movie_from_list(list_id, imdb_id):
    movie_list = MovieList.query.get_or_404(list_id)
    
    # Check if user owns this list
    if movie_list.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Find the movie by IMDB ID
    movie = Movie.query.filter_by(imdb_id=imdb_id).first_or_404()
    
    # Find and delete the list entry
    movie_in_list = MovieInList.query.filter_by(
        list_id=list_id,
        movie_id=movie.id
    ).first_or_404()
    
    try:
        db.session.delete(movie_in_list)
        db.session.commit()
        return jsonify({'message': 'Movie removed from list'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@movie_bp.route('/movie-lists/<int:list_id>', methods=['DELETE'])
@login_required
def delete_movie_list(list_id):
    movie_list = MovieList.query.get_or_404(list_id)
    
    # Check if user owns this list
    if movie_list.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        movie_list.delete_list()
        return jsonify({'message': 'List deleted successfully'})
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete list'}), 500 

@movie_bp.route('/movie-lists/<int:list_id>', methods=['GET'])
@login_required
def get_movie_list(list_id):
    try:
        movie_list = MovieList.query.get_or_404(list_id)
        
        # Check if user owns this list
        if movie_list.user_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify(movie_list.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500 