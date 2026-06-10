import { useStore } from '../store/useStore';

export default function BottomBar() {
  const wordCount = useStore((s) => s.wordCount);
  const saveStatus = useStore((s) => s.saveStatus);

  return (
    <div
      style={{
        height: '32px',
        borderTop: '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
        {wordCount} {wordCount === 1 ? 'word' : 'words'}
      </span>
      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
        {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
      </span>
    </div>
  );
}
