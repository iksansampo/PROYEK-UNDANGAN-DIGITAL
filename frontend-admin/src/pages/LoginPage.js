import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, checkSession } from '../services/api';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Cek jika sudah ada sesi aktif, langsung redirect ke dashboard
        checkSession().then(response => {
            if (response.data.loggedIn) {
                sessionStorage.setItem('isAuthenticated', 'true');
                navigate('/dashboard');
            }
        });
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login({ username, password });
            sessionStorage.setItem('isAuthenticated', 'true');
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Terjadi kesalahan saat login.');
        }
    };

    return (
        <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
            <h2>Admin Login</h2>
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label>Username</label>
                    <input
                        type="text"
                        className="form-control"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
            </form>
        </div>
    );
}

export default LoginPage;