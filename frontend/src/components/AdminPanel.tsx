import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface EnvVars {
    [key: string]: string;
}

interface User {
    id: number;
    username: string;
    email: string;
    is_admin: boolean;
}

const AdminPanel: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'env'|'scraping'|'users'>('env');
    const [envVars, setEnvVars] = useState<EnvVars>({});
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isScraping, setIsScraping] = useState(false);

    useEffect(() => {
        if (activeTab === 'env') {
            fetchEnvVars();
        } else if (activeTab === 'users') {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchEnvVars = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://localhost:5000/api/admin/env', {
                withCredentials: true
            });
            setEnvVars(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch environment variables');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://localhost:5000/api/admin/users', {
                withCredentials: true
            });
            setUsers(response.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnvVarChange = (key: string, value: string) => {
        setEnvVars(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const saveEnvVars = async () => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await axios.put(
                'http://localhost:5000/api/admin/env',
                envVars,
                { withCredentials: true }
            );
            setSuccess('Environment variables updated successfully');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update environment variables');
        } finally {
            setIsLoading(false);
        }
    };

    const triggerScraping = async () => {
        setIsScraping(true);
        setError(null);
        setSuccess(null);
        try {
            await axios.post(
                'http://localhost:5000/api/admin/scrape',
                {},
                { withCredentials: true }
            );
            setSuccess('Scraping process started');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to start scraping');
        } finally {
            setIsScraping(false);
        }
    };

    const deleteUser = async (userId: number) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await axios.delete(
                `http://localhost:5000/api/admin/users/${userId}`,
                { withCredentials: true }
            );
            setSuccess('User deleted successfully');
            fetchUsers();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to delete user');
        } finally {
            setIsLoading(false);
        }
    };

    const makeAdmin = async (userId: number) => {
        if (!window.confirm('Are you sure you want to make this user an admin?')) {
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await axios.post(
                `http://localhost:5000/api/admin/users/${userId}/make-admin`,
                {},
                { withCredentials: true }
            );
            setSuccess('User is now an admin');
            fetchUsers();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to make user admin');
        } finally {
            setIsLoading(false);
        }
    };

    // Only show admin panel for admin users
    if (!user || !user.is_admin) {
        return null;
    }

    return (
        <div className="admin-panel">
            <h2>Admin Panel</h2>
            
            <div className="admin-tabs">
                <button 
                    className={`tab-button ${activeTab === 'env' ? 'active' : ''}`}
                    onClick={() => setActiveTab('env')}
                >
                    Environment Variables
                </button>
                <button 
                    className={`tab-button ${activeTab === 'scraping' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scraping')}
                >
                    Scraping
                </button>
                <button 
                    className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    User Management
                </button>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            {activeTab === 'env' && (
                <div className="env-vars-section">
                    <h3>Environment Variables</h3>
                    {isLoading ? (
                        <div>Loading...</div>
                    ) : (
                        <div className="env-vars-form">
                            {Object.entries(envVars).map(([key, value]) => (
                                <div key={key} className="env-var-input">
                                    <label htmlFor={key}>{key}</label>
                                    <input
                                        type="text"
                                        id={key}
                                        value={value}
                                        onChange={(e) => handleEnvVarChange(key, e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            ))}
                            <button 
                                onClick={saveEnvVars} 
                                disabled={isLoading}
                                className="save-button"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'scraping' && (
                <div className="scraping-section">
                    <h3>Manual Scraping</h3>
                    <button
                        onClick={triggerScraping}
                        disabled={isScraping}
                        className="scrape-button"
                    >
                        {isScraping ? 'Scraping...' : 'Start Scraping'}
                    </button>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="users-section">
                    <h3>User Management</h3>
                    {isLoading ? (
                        <div>Loading...</div>
                    ) : (
                        <div className="users-list">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Admin</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td>{u.id}</td>
                                            <td>{u.username}</td>
                                            <td>{u.email}</td>
                                            <td>{u.is_admin ? 'Yes' : 'No'}</td>
                                            <td>
                                                {u.id !== user.id && (
                                                    <>
                                                        <button
                                                            onClick={() => deleteUser(u.id)}
                                                            className="delete-button"
                                                            disabled={isLoading}
                                                        >
                                                            Delete
                                                        </button>
                                                        {!u.is_admin && (
                                                            <button
                                                                onClick={() => makeAdmin(u.id)}
                                                                className="admin-button"
                                                                disabled={isLoading}
                                                            >
                                                                Make Admin
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminPanel; 