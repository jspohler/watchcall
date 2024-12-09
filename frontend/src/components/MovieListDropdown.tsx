import React, { useState, useEffect, useRef } from 'react';
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
  created_at: string;
}

interface MovieListDropdownProps {
  onListSelect: (list: MovieList) => void;
}

const MovieListDropdown: React.FC<MovieListDropdownProps> = ({ onListSelect }) => {
  const [lists, setLists] = useState<MovieList[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchLists = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Fetching movie lists...');
        const response = await axios.get('http://localhost:5000/api/movie-lists', {
          withCredentials: true
        });
        console.log('Received lists:', response.data);
        setLists(response.data);
      } catch (err: any) {
        console.error('Error fetching lists:', err.response || err);
        if (err.response?.status === 401) {
          setError('Please log in again');
        } else {
          setError('Failed to load movie lists');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLists();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAddingNew(false);
        setNewListName('');
        setError(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAddingNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingNew]);

  const handleAddList = async () => {
    if (!newListName.trim()) {
      setError('List name cannot be empty');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        'http://localhost:5000/api/movie-lists',
        { name: newListName },
        { withCredentials: true }
      );
      setLists([...lists, response.data]);
      setNewListName('');
      setIsAddingNew(false);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Please log in again');
      } else {
        setError(err.response?.data?.error || 'Failed to create list');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteList = async (list: MovieList, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (list.is_default) {
      setError('Cannot delete default lists');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${list.name}"?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await axios.delete(`http://localhost:5000/api/movie-lists/${list.id}`, {
        withCredentials: true
      });
      setLists(lists.filter(l => l.id !== list.id));
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Please log in again');
      } else {
        setError(err.response?.data?.error || 'Failed to delete list');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddList();
    } else if (e.key === 'Escape') {
      setIsAddingNew(false);
      setNewListName('');
      setError(null);
    }
  };

  return (
    <div className="movie-list-container" ref={dropdownRef}>
      <div className="movie-list-controls">
        <button
          className="movie-list-button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
        >
          Movie Lists {isLoading ? '...' : '▾'}
        </button>
        <button
          className="add-list-button"
          onClick={() => {
            setIsAddingNew(true);
            setIsOpen(true);
          }}
          title="Create new list"
          disabled={isLoading}
        >
          +
        </button>
      </div>

      {isOpen && (
        <div className="movie-list-dropdown">
          {error && <div className="list-error-message">{error}</div>}
          {isLoading && <div className="list-loading">Loading...</div>}
          {!isLoading && lists.map((list) => (
            <div
              key={list.id}
              className={`movie-list-item ${list.is_default ? 'default' : ''}`}
              onClick={() => {
                onListSelect(list);
                setIsOpen(false);
              }}
            >
              <span className="list-name">{list.name}</span>
              {!list.is_default && (
                <button
                  className="delete-list-button"
                  onClick={(e) => handleDeleteList(list, e)}
                  title="Delete list"
                  disabled={isLoading}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {isAddingNew && (
            <div className="add-list-form">
              <input
                ref={inputRef}
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter list name..."
                className="add-list-input"
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MovieListDropdown; 