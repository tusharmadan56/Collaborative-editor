import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { RefreshCw, Users, Link2 } from 'lucide-react';

const features = [
  {
    icon: RefreshCw,
    title: 'Real-time sync',
    description: 'Every keystroke syncs instantly across all connected users.',
  },
  {
    icon: Users,
    title: 'Live presence',
    description: 'See who is online and where they are editing in real time.',
  },
  {
    icon: Link2,
    title: 'Shareable rooms',
    description: 'Create a room and share the link. Collaboration starts immediately.',
  },
];

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      <Navbar variant="landing" />

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 40px' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
          <p style={{ fontSize: '13px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
            Real-time collaboration
          </p>
          <h1 style={{ fontSize: '3.25rem', fontWeight: 600, color: '#111827', lineHeight: 1.15, marginBottom: '24px' }}>
            Write together,
            <br />
            in real time.
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#6B7280', maxWidth: '420px', margin: '0 auto 40px', lineHeight: 1.6 }}>
            A minimal collaborative editor. Create a room, share the link, start writing.
          </p>
          <Link
            to="/register"
            style={{
              display: 'inline-block',
              fontSize: '14px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              padding: '10px 24px',
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
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '48px', maxWidth: '720px', margin: '96px auto 0', width: '100%' }}>
          {features.map((feature) => (
            <div key={feature.title} style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <feature.icon size={20} color="#6B7280" />
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#111827', marginBottom: '4px' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: 1.6 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #E5E7EB', padding: '24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>CollabEdit</span>
          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Built with Node.js and Socket.io</span>
        </div>
      </footer>
    </div>
  );
}
