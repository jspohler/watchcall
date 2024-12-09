import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface Movie {
  id: number;
  movie_id: string;
  title: string;
  poster?: string;
  year?: string;
  added_at: string;
}

interface MovieList {
  id: number;
  name: string;
  is_default: boolean;
  movies: Movie[];
}

interface MovieListViewProps {
  list: MovieList | null;
  onMovieSelect: (movieId: string) => void;
  onClose: () => void;
}

const MovieListView: React.FC<MovieListViewProps> = ({ list: initialList, onMovieSelect, onClose }) => {
  const { user } = useAuth();
  const [list, setList] = useState<MovieList | null>(initialList);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListData = async () => {
    if (!initialList) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:5000/api/movie-lists/${initialList.id}`, {
        withCredentials: true
      });
      setList(response.data);
    } catch (err) {
      console.error('Error fetching list data:', err);
      setError('Failed to load list data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListData();
  }, [initialList?.id]);

  const handleRemoveMovie = async (movie: Movie, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent movie selection when clicking remove
    
    if (!list) return;

    if (!window.confirm(`Remove "${movie.title}" from ${list.name}?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await axios.delete(
        `http://localhost:5000/api/movie-lists/${list.id}/movies/${movie.movie_id}`,
        { withCredentials: true }
      );
      // Refresh the list data
      await fetchListData();
    } catch (err) {
      console.error('Error removing movie:', err);
      setError('Failed to remove movie from list');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !list) return null;

  return (
    <div className="movie-list-view">
      <div className="movie-list-header">
        <button className="back-button" onClick={onClose}>← Back</button>
        <h2>{list.name}</h2>
        <div className="movie-count">{list.movies.length} movies</div>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {isLoading ? (
        <div className="loading-message">Loading...</div>
      ) : list.movies.length === 0 ? (
        <div className="empty-list">
          <p>No movies in this list yet</p>
          <p>Search for movies above to add them to your list</p>
        </div>
      ) : (
        <div className="movie-grid">
          {list.movies.map((movie) => (
            <div 
              key={movie.id} 
              className="movie-card" 
              onClick={() => onMovieSelect(movie.movie_id)}
              style={{ background: '#282c34', color: '#fff' }}
            >
              <img
                src={movie.poster || '/placeholder.png'}
                alt={movie.title}
                className="movie-poster"
              />
              <div className="movie-info">
                <div className="movie-header">
                  <h3>{movie.title}</h3>
                  <button
                    className="remove-movie-button"
                    onClick={(e) => handleRemoveMovie(movie, e)}
                    title="Remove from list"
                  >
                    ×
                  </button>
                </div>
                {movie.year && <span className="movie-year">{movie.year}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MovieListView; 