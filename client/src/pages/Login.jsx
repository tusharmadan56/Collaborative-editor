import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../api/axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setUser = useStore((s) => s.setUser);
  const setToken = useStore((s) => s.setToken);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      setToken(data.token);
      setUser(data.user || { email });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          padding: '40px 32px',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'block',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: 700,
            color: '#111827',
            textDecoration: 'none',
            marginBottom: '32px',
          }}
        >
          CollabEdit
        </Link>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="login-email"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '10px 12px',
                fontSize: '14px',
                color: '#111827',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
              onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label
              htmlFor="login-password"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              style={{
                width: '100%',
                border: '1px solid #D1D5DB',
                borderRadius: '6px',
                padding: '10px 12px',
                fontSize: '14px',
                color: '#111827',
                outline: 'none',
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
              onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
            />
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 500,
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#1D4ED8')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563EB')}
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <p
          style={{
            fontSize: '14px',
            color: '#6B7280',
            textAlign: 'center',
            marginTop: '24px',
          }}
        >
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{
              color: '#2563EB',
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
