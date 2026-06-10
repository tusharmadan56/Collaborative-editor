# CollabEdit — Real-Time Collaborative Text Editor

A minimal, clean, production-grade collaborative text editor built with React. Create rooms, share links, and write together in real time with live cursors and presence.

> **Note:** This is a **text/rich-text editor**, not a code editor. Think Google Docs, stripped down to its core.

---

## Screenshots

_Coming soon_

---

## Tech Stack

| Layer          | Technology                  |
| -------------- | --------------------------- |
| Framework      | React + Vite                |
| Styling        | Tailwind CSS v4             |
| Editor         | TipTap (rich text)          |
| Real-time      | Socket.io-client            |
| Routing        | React Router v6             |
| State          | Zustand                     |
| HTTP           | Axios                       |
| Icons          | Lucide React                |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- The backend server running (see [Backend README](../README.md))

### Installation

```bash
# From the project root
cd client

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Environment Variables

| Variable          | Default                  | Description                    |
| ----------------- | ------------------------ | ------------------------------ |
| `VITE_API_URL`    | `http://localhost:3000`  | Backend API base URL           |
| `VITE_SOCKET_URL` | `http://localhost:3000`  | Socket.io server URL           |

### Development

```bash
npm run dev
```

The app will start at `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run preview
```

---

## Connecting to the Backend

1. Start the backend server (default: `http://localhost:3000`)
2. Ensure your `.env` file points to the correct backend URL
3. The frontend will automatically:
   - Send auth requests to `{VITE_API_URL}/api/auth/login` and `/register`
   - Fetch rooms from `{VITE_API_URL}/api/rooms`
   - Connect WebSockets to `{VITE_SOCKET_URL}`

### API Endpoints Used

| Method | Endpoint              | Description          |
| ------ | --------------------- | -------------------- |
| POST   | `/api/auth/register`  | Create new account   |
| POST   | `/api/auth/login`     | Login                |
| GET    | `/api/rooms`          | List user's rooms    |
| POST   | `/api/rooms`          | Create a new room    |

### Socket Events

| Event (Emit)    | Payload                              |
| --------------- | ------------------------------------ |
| `join-room`     | `{ roomId, token }`                  |
| `leave-room`    | `{ roomId }`                         |
| `text-delta`    | `{ roomId, delta, version }`         |
| `cursor-move`   | `{ roomId, position, userId }`       |

| Event (Listen)  | Payload                              |
| --------------- | ------------------------------------ |
| `room-joined`   | `{ users, document }`               |
| `user-joined`   | `{ id, email }`                      |
| `user-left`     | `{ userId }`                         |
| `text-delta`    | `{ delta, version, userId }`         |
| `cursor-update` | `{ position, userId }`               |
| `auth-error`    | `{ message }`                        |

---

## Project Structure

```
src/
├── pages/
│   ├── Landing.jsx         # Home page with hero + features
│   ├── Login.jsx           # Login form
│   ├── Register.jsx        # Registration form
│   ├── Dashboard.jsx       # Room management
│   └── Editor.jsx          # Collaborative editor
├── components/
│   ├── Navbar.jsx           # Top navigation
│   ├── RoomCard.jsx         # Room list item
│   ├── UserAvatar.jsx       # Colored avatar circle
│   ├── PresenceSidebar.jsx  # Online users panel
│   ├── TopBar.jsx           # Editor top bar
│   ├── BottomBar.jsx        # Word count + save status
│   └── editor/
│       ├── TipTapEditor.jsx # TipTap editor wrapper
│       └── CursorLabel.jsx  # Floating cursor name label
├── store/
│   └── useStore.js          # Zustand global state
├── socket/
│   └── socket.js            # Socket.io client
├── api/
│   └── axios.js             # Axios instance with auth
├── hooks/
│   └── useRoom.js           # Room socket lifecycle hook
├── App.jsx                  # Routes + auth protection
├── main.jsx                 # Entry point
└── index.css                # Tailwind + global styles
```

---

## License

MIT
