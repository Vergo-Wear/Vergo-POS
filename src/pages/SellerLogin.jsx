import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SellerLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/seller/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('sellerToken', data.token);
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-area" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
          <img src="/logo white.png" alt="Vergo Logo" className="app-logo" style={{ height: '40px' }} />
          <h4>POS Login</h4>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input 
              type="text" 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn-seller-login" disabled={loading}>
            {loading ? 'Authenticating...' : 'Login to POS'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Are you an Admin?</p>
          <button 
            className="btn-back" 
            onClick={() => navigate('/login')}
            style={{ color: 'var(--accent-green)', textDecoration: 'none', fontWeight: 'bold' }}
          >
            Go to Admin Portal &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerLogin;
