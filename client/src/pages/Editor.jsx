import { useParams } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import TopBar from '../components/TopBar';
import PresenceSidebar from '../components/PresenceSidebar';
import BottomBar from '../components/BottomBar';
import TipTapEditor from '../components/editor/TipTapEditor';

export default function Editor() {
  const { id: roomId } = useParams();
  const { editorRef } = useRoom(roomId);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
      <TopBar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <PresenceSidebar />
        <TipTapEditor key={roomId} roomId={roomId} editorRef={editorRef} />
      </div>
      <BottomBar />
    </div>
  );
}
