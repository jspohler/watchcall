import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

export interface MovieSearchResult {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Type: string;
}

export interface MovieDetails {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Poster: string;
  Ratings: Array<{ Source: string; Value: string }>;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
}

export interface StreamingAvailability {
  id: number;
  movie_id: string;
  service: string;
  available_from: string | null;
  available_until: string | null;
  region: string;
}

export const searchMovies = async (query: string): Promise<MovieSearchResult[]> => {
  if (!query.trim()) return [];
  
  try {
    const response = await axios.get(`${BASE_URL}/movies/search`, {
      params: { query },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error searching movies:', error);
    return [];
  }
};

export const getMovieDetails = async (imdbId: string): Promise<MovieDetails | null> => {
  try {
    const response = await axios.get(`${BASE_URL}/movies/${imdbId}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return null;
  }
};

export const getStreamingAvailability = async (movieId: string): Promise<StreamingAvailability[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/streaming/${movieId}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching streaming availability:', error);
    return [];
  }
}; 