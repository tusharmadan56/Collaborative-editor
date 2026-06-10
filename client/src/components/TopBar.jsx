import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import UserAvatar from './UserAvatar';
import { Link2, Check, ArrowLeft } from 'lucide-react';

export default function TopBar() {
  const currentRoom = useStore((s) => s.currentRoom);
  const onlineUsers = useStore((s) => s.onlineUsers);
  const connectionStatus = useStore((s) => s.connectionStatus);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const maxAvatars = 3;
  const visibleUsers = onlineUsers.slice(0, maxAvatars);
  const extraCount = Math.max(0, onlineUsers.length - maxAvatars);

  const statusConfig = {
    connected: { color: '#16A34A', text: 'Live' },
    connecting: { color: '#9CA3AF', text: 'Connecting...' },
    disconnected: { color: '#DC2626', text: 'Disconnected' },
  };

  const status = statusConfig[connectionStatus] || statusConfig.disconnected;

  return (
    <div
      style={{
        height: '48px',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link to="/dashboard" style={{ color: '#6B7280', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={16} />
        </Link>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
          {currentRoom?.name || 'Loading...'}
        </span>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Share */}
        <button
          onClick={handleCopyLink}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#6B7280',
            backgroundColor: 'transparent',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            padding: '4px 10px',
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
        >
          {copied ? <Check size={14} color="#16A34A" /> : <Link2 size={14} />}
          {copied ? 'Copied!' : 'Share'}
        </button>

        {/* User avatars */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {visibleUsers.map((u, i) => (
            <div key={u.id} style={{ marginLeft: i > 0 ? '-6px' : 0 }}>
              <UserAvatar email={u.email} index={i} size="sm" />
            </div>
          ))}
          {extraCount > 0 && (
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#F3F4F6',
                border: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: '#6B7280',
                fontWeight: 500,
                marginLeft: '-6px',
              }}
            >
              +{extraCount}
            </div>
          )}
        </div>

        {/* Connection status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: status.color }} />
          <span style={{ fontSize: '12px', color: '#6B7280' }}>{status.text}</span>
        </div>
      </div>
    </div>
  );
}
