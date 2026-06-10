import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { LogOut } from 'lucide-react';

export default function Navbar({ variant = 'default' }) {
  const user = useStore((s) => s.user);
  const token = useStore((s) => s.token);
  const logout = useStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <nav
      style={{
        height: '56px',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Link to="/" style={{ fontSize: '16px', fontWeight: 700, color: '#111827', textDecoration: 'none', letterSpacing: '-0.01em' }}>
        CollabEdit
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {token && user ? (
          <>
            <span style={{ fontSize: '14px', color: '#6B7280' }}>{user.email}</span>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                color: '#6B7280',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'color 0.15s',
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </>
        ) : variant === 'landing' ? (
          <>
            <Link to="/login" style={{ fontSize: '14px', color: '#6B7280', textDecoration: 'none', transition: 'color 0.15s' }}>
              Login
            </Link>
            <Link
              to="/register"
              style={{
                fontSize: '14px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#1D4ED8')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563EB')}
            >
              Get Started
            </Link>
          </>
        ) : null}
      </div>
    </nav>
  );
}
