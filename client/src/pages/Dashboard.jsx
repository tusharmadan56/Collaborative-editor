import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import Navbar from '../components/Navbar';
import RoomCard from '../components/RoomCard';
import api from '../api/axios';
import { Plus, LogIn, X } from 'lucide-react';

export default function Dashboard() {
  const rooms = useStore((s) => s.rooms);
  const setRooms = useStore((s) => s.setRooms);
  const addRoom = useStore((s) => s.addRoom);
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data } = await api.get('/api/rooms');
        setRooms(data.rooms || data || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [setRooms]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setError('');
    setCreating(true);

    try {
      const { data } = await api.post('/api/rooms', { name: roomName.trim() });
      addRoom(data.room || data);
      setRoomName('');
      setShowCreateModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    setJoinError('');

    let roomId = joinRoomId.trim();

    // Extract room ID from full URL if pasted
    const urlMatch = roomId.match(/\/room\/([a-zA-Z0-9-]+)/);
    if (urlMatch) {
      roomId = urlMatch[1];
    }

    if (!roomId) {
      setJoinError('Please enter a Room ID or link.');
      return;
    }

    setShowJoinModal(false);
    setJoinRoomId('');
    navigate(`/room/${roomId}`);
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

  const buttonPrimary = {
    width: '100%',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 500,
    padding: '10px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <Navbar />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#111827' }}>Your Rooms</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowJoinModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                backgroundColor: '#FFFFFF',
                color: '#374151',
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'border-color 0.15s',
              }}
            >
              <LogIn size={16} />
              Join Room
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = '#1D4ED8')}
              onMouseLeave={(e) => (e.target.style.backgroundColor = '#2563EB')}
            >
              <Plus size={16} />
              New Room
            </button>
          </div>
        </div>

        {/* Create Room Modal */}
        {showCreateModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px', margin: '0 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Create a new room</h2>
                <button
                  onClick={() => { setShowCreateModal(false); setError(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '4px' }}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreate}>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Room name"
                  autoFocus
                  style={{ ...inputStyle, marginBottom: '16px' }}
                  onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                  onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
                />
                {error && <p style={{ fontSize: '13px', color: '#DC2626', marginBottom: '12px' }}>{error}</p>}
                <button
                  type="submit"
                  disabled={creating || !roomName.trim()}
                  style={{ ...buttonPrimary, opacity: (creating || !roomName.trim()) ? 0.5 : 1 }}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Join Room Modal */}
        {showJoinModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '24px', margin: '0 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Join a room</h2>
                <button
                  onClick={() => { setShowJoinModal(false); setJoinError(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '4px' }}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleJoin}>
                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
                  Paste a room ID or a shared room link to join.
                </p>
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="Room ID or link (e.g. http://…/room/abc-123)"
                  autoFocus
                  style={{ ...inputStyle, marginBottom: '16px' }}
                  onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
                  onBlur={(e) => (e.target.style.borderColor = '#D1D5DB')}
                />
                {joinError && <p style={{ fontSize: '13px', color: '#DC2626', marginBottom: '12px' }}>{joinError}</p>}
                <button
                  type="submit"
                  disabled={!joinRoomId.trim()}
                  style={{ ...buttonPrimary, opacity: !joinRoomId.trim() ? 0.5 : 1 }}
                >
                  Join Room
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Room grid */}
        {loading ? (
          <p style={{ fontSize: '14px', color: '#6B7280', textAlign: 'center', padding: '64px 0' }}>Loading...</p>
        ) : rooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '96px 0' }}>
            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px' }}>No rooms yet. Create one to get started.</p>
            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Or join an existing room using a shared link.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
