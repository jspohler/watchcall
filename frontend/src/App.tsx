import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForm from './components/Auth';
import SettingsModal from './components/Settings';
import MovieSearch from './components/MovieSearch';
import MovieDetails from './components/MovieDetails';
import MovieListDropdown from './components/MovieListDropdown';
import MovieListView from './components/MovieListView';
import AdminPanel from './components/AdminPanel';
import StreamingServices from './components/StreamingServices';
import { ResetPasswordForm } from './components/PasswordReset';

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

const MenuBar: React.FC<{ 
  onMovieSelect: (movieId: string) => void;
  onListSelect: (list: MovieList) => void;
  onLogoClick: () => void;
}> = ({ onMovieSelect, onListSelect, onLogoClick }) => {
  const { user, logout } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  if (!user) return null;

  const handleServicesChange = (services: string[]) => {
    setSelectedServices(services);
    // TODO: Save selected services to user preferences
  };

  return (
    <>
      <div className="menu-bar">
        <div className="menu-left">
          <div className="menu-logo" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
            WatchCall
          </div>
          <MovieListDropdown onListSelect={onListSelect} />
          <StreamingServices onServicesChange={handleServicesChange} />
        </div>
        <div className="menu-center">
          <MovieSearch onMovieSelect={onMovieSelect} />
        </div>
        <div className="menu-right">
          <span className="username">{user.username}</span>
          <button 
            className="settings-button" 
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
          >
            ⚙️
          </button>
          <button className="logout-button" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
};

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<MovieList | null>(null);

  const handleMovieSelect = (movieId: string) => {
    setSelectedMovieId(movieId);
    setSelectedList(null);
  };

  const handleListSelect = (list: MovieList) => {
    setSelectedList(list);
    setSelectedMovieId(null);
  };

  const handleCloseMovieDetails = () => {
    setSelectedMovieId(null);
  };

  const handleCloseListView = () => {
    setSelectedList(null);
  };

  const handleLogoClick = () => {
    setSelectedMovieId(null);
    setSelectedList(null);
  };

  return (
    <div className="App">
      <MenuBar 
        onMovieSelect={handleMovieSelect}
        onListSelect={handleListSelect}
        onLogoClick={handleLogoClick}
      />
      <main className="App-main">
        <Routes>
          <Route path="/reset-password/:token" element={<ResetPasswordForm />} />
          <Route path="/" element={
            !user ? (
              <div className="auth-container">
                <h1>WatchCall</h1>
                <p className="tagline">Get notified when your favorite movies arrive on your streaming services</p>
                <AuthForm isLogin={isLogin} />
                <button 
                  className="toggle-auth" 
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? 'New to WatchCall? Sign up' : 'Already have a WatchCall account? Login'}
                </button>
              </div>
            ) : (
              <div className="dashboard">
                {selectedMovieId ? (
                  <MovieDetails 
                    movieId={selectedMovieId} 
                    onClose={handleCloseMovieDetails}
                  />
                ) : selectedList ? (
                  <MovieListView
                    list={selectedList}
                    onMovieSelect={handleMovieSelect}
                    onClose={handleCloseListView}
                  />
                ) : (
                  <>
                    <div className="dashboard-welcome">
                      <h2>Welcome to WatchCall, {user.username}!</h2>
                      <p>Search for a movie above to get started</p>
                    </div>
                    {user.is_admin && <AdminPanel />}
                  </>
                )}
              </div>
            )
          } />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
