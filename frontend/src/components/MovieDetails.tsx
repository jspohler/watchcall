import React, { useEffect, useState } from 'react';
import { getMovieDetails, MovieDetails as MovieDetailsType, getStreamingAvailability, StreamingAvailability } from '../services/movieApi';
import AddToListButton from './AddToListButton';
import axios from 'axios';

interface MovieDetailsProps {
  movieId: string | null;
  onClose: () => void;
}

const MovieDetails: React.FC<MovieDetailsProps> = ({ movieId, onClose }) => {
  const [movie, setMovie] = useState<MovieDetailsType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingAvailability, setStreamingAvailability] = useState<StreamingAvailability[]>([]);
  const [userServices, setUserServices] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!movieId) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const [details, availability, servicesResponse] = await Promise.all([
          getMovieDetails(movieId),
          getStreamingAvailability(movieId),
          axios.get('http://localhost:5000/api/user/services', { withCredentials: true })
        ]);
        setMovie(details);
        setStreamingAvailability(availability);
        setUserServices(servicesResponse.data);
      } catch (err) {
        setError('Failed to load movie details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [movieId]);

  if (!movieId) return null;
  if (isLoading) return <div className="movie-details-loading">Loading...</div>;
  if (error) return <div className="movie-details-error">{error}</div>;
  if (!movie) return null;

  // Filter streaming services to only show those the user is subscribed to
  const availableOnUserServices = streamingAvailability
    .filter(avail => userServices.includes(avail.service));

  return (
    <div className="movie-details">
      <div className="movie-details-header">
        <button className="back-button" onClick={onClose}>← Back to Search</button>
      </div>
      <div className="movie-details-content">
        <div className="movie-details-main">
          <img
            src={movie.Poster !== 'N/A' ? movie.Poster : '/placeholder.png'}
            alt={movie.Title}
            className="details-poster"
          />
          <div className="details-info">
            <h1>{movie.Title}</h1>
            <div className="movie-meta">
              <span className="year">{movie.Year}</span>
              <span className="runtime">{movie.Runtime}</span>
              <span className="rated">{movie.Rated}</span>
            </div>
            <div className="movie-rating">
              <span className="imdb-rating">IMDb: {movie.imdbRating}</span>
              <span className="imdb-votes">({movie.imdbVotes} votes)</span>
            </div>
            <div className="movie-genre">{movie.Genre}</div>
            {availableOnUserServices.length > 0 && (
              <div className="streaming-availability">
                <h3>Available on:</h3>
                <div className="streaming-services-list">
                  {availableOnUserServices.map(avail => (
                    <div key={avail.id} className="streaming-service">
                      {avail.service}
                      {avail.available_until && (
                        <span className="availability-until">
                          Until {new Date(avail.available_until).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="movie-actions">
              <AddToListButton
                movieId={movie.imdbID}
                movieTitle={movie.Title}
                moviePoster={movie.Poster !== 'N/A' ? movie.Poster : undefined}
                movieYear={movie.Year}
              />
            </div>
            <p className="movie-plot">{movie.Plot}</p>
          </div>
        </div>
        
        <div className="movie-details-grid">
          <div className="info-item">
            <h3>Director</h3>
            <p>{movie.Director}</p>
          </div>
          <div className="info-item">
            <h3>Writers</h3>
            <p>{movie.Writer}</p>
          </div>
          <div className="info-item">
            <h3>Cast</h3>
            <p>{movie.Actors}</p>
          </div>
          <div className="info-item">
            <h3>Released</h3>
            <p>{movie.Released}</p>
          </div>
        </div>

        {movie.Ratings && movie.Ratings.length > 0 && (
          <div className="movie-ratings">
            <h3>Ratings</h3>
            <div className="ratings-grid">
              {movie.Ratings.map((rating, index) => (
                <div key={index} className="rating-item">
                  <span className="rating-source">{rating.Source}</span>
                  <span className="rating-value">{rating.Value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieDetails; 