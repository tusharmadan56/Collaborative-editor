import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { connectSocket, disconnectSocket, getSocket } from '../socket/socket';

export function useRoom(roomId) {
  const token = useStore((s) => s.token);
  const setOnlineUsers = useStore((s) => s.setOnlineUsers);
  const addOnlineUser = useStore((s) => s.addOnlineUser);
  const removeOnlineUser = useStore((s) => s.removeOnlineUser);
  const setConnectionStatus = useStore((s) => s.setConnectionStatus);
  const setCurrentRoom = useStore((s) => s.setCurrentRoom);
  const setDocumentData = useStore((s) => s.setDocumentData);
  const clearDocumentData = useStore((s) => s.clearDocumentData);
  const editorRef = useRef(null);

  useEffect(() => {
    if (!roomId || !token) return;

    const socket = connectSocket(token);
    setConnectionStatus('connecting');

    const onConnect = () => {
      setConnectionStatus('connected');
      socket.emit('join-room', { roomId, token });
    };

    const onDisconnect = () => {
      setConnectionStatus('disconnected');
    };

    const onReconnectAttempt = () => {
      setConnectionStatus('connecting');
    };

    const onRoomJoined = ({ users, document: doc }) => {
      setOnlineUsers(users || []);
      setCurrentRoom({ id: roomId, name: doc?.name || roomId.slice(0, 8) });
      // Store document data in Zustand so TipTapEditor can pick it up
      // This eliminates the race condition where TipTapEditor's useEffect
      // hadn't registered its listener before room-joined fired.
      setDocumentData(doc || { content: '', version: 0 });
    };

    const onUserJoined = (user) => {
      addOnlineUser({ id: user.userId || user.id, email: user.email });
    };

    const onUserLeft = ({ userId }) => {
      removeOnlineUser(userId);
    };

    const onAuthError = () => {
      useStore.getState().logout();
      window.location.href = '/login';
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('room-joined', onRoomJoined);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('auth-error', onAuthError);

    // If socket is already connected (e.g. reconnect), join immediately
    if (socket.connected) {
      onConnect();
    }

    return () => {
      const s = getSocket();
      if (s) {
        s.emit('leave-room', { roomId });
        s.off('connect', onConnect);
        s.off('disconnect', onDisconnect);
        s.off('reconnect_attempt', onReconnectAttempt);
        s.off('room-joined', onRoomJoined);
        s.off('user-joined', onUserJoined);
        s.off('user-left', onUserLeft);
        s.off('auth-error', onAuthError);
      }
      disconnectSocket();
      setConnectionStatus('disconnected');
      setOnlineUsers([]);
      setCurrentRoom(null);
      clearDocumentData();
    };
  }, [roomId, token]);

  return { editorRef };
}

