import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import { useState } from 'react';

export default function RoomCard({ room }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const formattedDate = new Date(room.created_at || room.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <button
      onClick={() => navigate(`/room/${room.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        textAlign: 'left',
        backgroundColor: '#FFFFFF',
        border: `1px solid ${hovered ? '#2563EB' : '#E5E7EB'}`,
        borderRadius: '8px',
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {room.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
          <span style={{ fontSize: '12px', color: '#6B7280' }}>{formattedDate}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6B7280' }}>
            <Users size={12} />
            {room.memberCount || room.member_count || 0} members
          </span>
        </div>
      </div>
      <ArrowRight
        size={16}
        style={{
          color: hovered ? '#2563EB' : '#D1D5DB',
          transition: 'color 0.15s',
          flexShrink: 0,
          marginTop: '2px',
        }}
      />
    </button>
  );
}
