import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface MovieList {
  id: number;
  name: string;
  is_default: boolean;
}

interface AddToListButtonProps {
  movieId: string;
  movieTitle: string;
  moviePoster?: string;
  movieYear?: string;
}

const AddToListButton: React.FC<AddToListButtonProps> = ({ 
  movieId, 
  movieTitle, 
  moviePoster, 
  movieYear 
}) => {
  const [lists, setLists] = useState<MovieList[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchLists = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:5000/api/movie-lists', {
          withCredentials: true
        });
        setLists(response.data);
      } catch (err: any) {
        console.error('Error fetching lists:', err);
        setError('Failed to load lists');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLists();
  }, [isOpen]);

  const handleAddToList = async (listId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await axios.post(
        `http://localhost:5000/api/movie-lists/${listId}/movies`,
        {
          movieId,
          title: movieTitle,
          poster: moviePoster,
          year: movieYear
        },
        { withCredentials: true }
      );
      setIsOpen(false);
    } catch (err: any) {
      console.error('Error adding movie to list:', err);
      setError(err.response?.data?.error || 'Failed to add movie to list');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-to-list-container" ref={dropdownRef}>
      <button
        className="add-to-list-button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        Add to List
      </button>

      {isOpen && (
        <div className="add-to-list-dropdown">
          {error && <div className="list-error-message">{error}</div>}
          {isLoading ? (
            <div className="list-loading">Loading...</div>
          ) : (
            lists.map((list) => (
              <div
                key={list.id}
                className="list-item"
                onClick={() => handleAddToList(list.id)}
              >
                {list.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AddToListButton; 