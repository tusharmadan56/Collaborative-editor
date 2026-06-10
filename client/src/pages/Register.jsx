import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import api from '../api/axios';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setUser = useStore((s) => s.setUser);
  const setToken = useStore((s) => s.setToken);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/api/auth/register', { email, password });
      setToken(data.token);
      setUser(data.user || { email });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    padding: '10px 12px',
    fontSize: '14px',
    color: '#111827',
    outline: 'none',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '6px',
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
            <label htmlFor="register-email" style={labelStyle}>Email</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
              onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="register-password" style={labelStyle}>Password</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Min. 8 characters"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
              onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label htmlFor="register-confirm" style={labelStyle}>Confirm Password</label>
            <input
              id="register-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-enter your password"
              style={inputStyle}
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
            {loading ? 'Loading...' : 'Register'}
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
          Already have an account?{' '}
          <Link
            to="/login"
            style={{ color: '#2563EB', textDecoration: 'none', transition: 'color 0.15s' }}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
