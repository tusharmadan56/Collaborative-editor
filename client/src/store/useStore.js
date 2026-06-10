import { create } from 'zustand';

const getPersistedAuth = () => {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return {
      token: token || null,
      user: user ? JSON.parse(user) : null,
    };
  } catch {
    return { token: null, user: null };
  }
};

export const useStore = create((set) => ({
  // Auth
  ...getPersistedAuth(),
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, rooms: [], currentRoom: null, onlineUsers: [] });
  },

  // Rooms
  rooms: [],
  setRooms: (rooms) => set({ rooms }),
  addRoom: (room) => set((state) => ({ rooms: [room, ...state.rooms] })),

  // Current room
  currentRoom: null,
  setCurrentRoom: (currentRoom) => set({ currentRoom }),

  // Presence
  onlineUsers: [],
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  addOnlineUser: (user) =>
    set((state) => {
      if (state.onlineUsers.find((u) => u.id === user.id)) return state;
      return { onlineUsers: [...state.onlineUsers, user] };
    }),
  removeOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((u) => u.id !== userId),
    })),

  // Connection
  connectionStatus: 'disconnected',
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  // Document data (set by useRoom on room-joined, consumed by TipTapEditor)
  documentData: null,
  setDocumentData: (documentData) => set({ documentData }),
  clearDocumentData: () => set({ documentData: null }),

  // Editor meta
  wordCount: 0,
  setWordCount: (wordCount) => set({ wordCount }),
  saveStatus: 'saved',
  setSaveStatus: (saveStatus) => set({ saveStatus }),
}));
