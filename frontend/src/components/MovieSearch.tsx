import React, { useState, useEffect, useRef } from 'react';
import { searchMovies, MovieSearchResult } from '../services/movieApi';
import useDebounce from '../hooks/useDebounce';

interface MovieSearchProps {
  onMovieSelect: (movieId: string) => void;
}

const MovieSearch: React.FC<MovieSearchProps> = ({ onMovieSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchMovies = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await searchMovies(debouncedQuery);
        setResults(searchResults);
        setShowResults(true);
      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, [debouncedQuery]);

  const handleMovieClick = (movie: MovieSearchResult) => {
    onMovieSelect(movie.imdbID);
    setQuery('');
    setShowResults(false);
  };

  return (
    <div className="movie-search" ref={searchRef}>
      <div className="search-input-container">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for movies..."
          className="search-input"
          onFocus={() => setShowResults(true)}
        />
        {isLoading && <div className="search-loader">Loading...</div>}
      </div>

      {showResults && results.length > 0 && (
        <div className="search-results">
          {results.map((movie) => (
            <div
              key={movie.imdbID}
              className="search-result-item"
              onClick={() => handleMovieClick(movie)}
            >
              <img
                src={movie.Poster !== 'N/A' ? movie.Poster : '/placeholder.png'}
                alt={movie.Title}
                className="result-poster"
              />
              <div className="result-info">
                <div className="result-title">{movie.Title}</div>
                <div className="result-year">{movie.Year}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MovieSearch; 