import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ForgotPasswordForm } from './PasswordReset';

interface AuthFormProps {
  isLogin?: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ isLogin = true }) => {
  const { login, signup, error: authError, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const validateForm = () => {
    setFormError(null);
    if (!username.trim()) {
      setFormError('Username is required');
      return false;
    }
    if (!isLogin && !email.trim()) {
      setFormError('Email is required');
      return false;
    }
    if (!password.trim()) {
      setFormError('Password is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await signup(username, email, password);
      }
    } catch (err) {
      // Error is handled by AuthContext
    }
  };

  if (showForgotPassword) {
    return (
      <ForgotPasswordForm onCancel={() => setShowForgotPassword(false)} />
    );
  }

  return (
    <div className="auth-form">
      <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
      {(formError || authError) && (
        <div className="error-message" role="alert">
          {formError || authError}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="username">
            Username
            <span className="required" aria-hidden="true">*</span>
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="username"
            aria-required="true"
          />
        </div>
        {!isLogin && (
          <div className="form-group">
            <label htmlFor="email">
              Email
              <span className="required" aria-hidden="true">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="email"
              aria-required="true"
            />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="password">
            Password
            <span className="required" aria-hidden="true">*</span>
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            autoComplete={isLogin ? "current-password" : "new-password"}
            aria-required="true"
          />
          {isLogin && (
            <button
              type="button"
              className="forgot-password-button"
              onClick={() => setShowForgotPassword(true)}
              disabled={isLoading}
            >
              Forgot password?
            </button>
          )}
        </div>
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
        </button>
      </form>
    </div>
  );
};

export default AuthForm; 