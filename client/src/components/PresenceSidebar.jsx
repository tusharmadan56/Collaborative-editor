import { useStore } from '../store/useStore';
import { getUserColor } from './UserAvatar';

export default function PresenceSidebar() {
  const onlineUsers = useStore((s) => s.onlineUsers);
  const user = useStore((s) => s.user);

  return (
    <aside
      style={{
        width: '200px',
        borderRight: '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF',
        padding: '16px',
        flexShrink: 0,
        overflowY: 'auto',
      }}
    >
      <h3
        style={{
          fontSize: '11px',
          color: '#9CA3AF',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontWeight: 500,
          marginBottom: '12px',
        }}
      >
        Online
      </h3>

      {onlineUsers.length === 0 && (
        <p style={{ fontSize: '13px', color: '#6B7280' }}>Just you</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {onlineUsers.map((u, i) => (
          <li key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: getUserColor(i),
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '13px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {u.email}{u.id === user?.id ? ' (you)' : ''}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
