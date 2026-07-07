import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [joinId, setJoinId] = useState('');
  const [roomsList, setRoomsList] = useState([]);
  const [profileStats, setProfileStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch rooms list and profile stats on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [roomsRes, statsRes] = await Promise.all([
          api.get('/rooms/my-rooms'),
          api.get('/auth/me'),
        ]);
        setRoomsList(roomsRes.data.rooms || []);
        setProfileStats(statsRes.data.user);
      } catch (err) {
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleCreate = async () => {
    setError('');
    try {
      const { data } = await api.post('/rooms/create', { name: roomName || undefined });
      navigate(`/editor/${data.room.roomId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    }
  };

  const handleJoin = async () => {
    setError('');
    if (!joinId.trim()) return;
    try {
      await api.post('/rooms/join', { roomId: joinId.trim() });
      navigate(`/editor/${joinId.trim()}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Room not found');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white bg-grid relative overflow-hidden font-sans pb-16">
      {/* Background glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>

      {/* Navigation Header */}
      <nav className="border-b border-gray-900 bg-gray-900/50 px-6 py-4 flex justify-between items-center backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
            <span className="bg-indigo-600 text-white w-6.5 h-6.5 rounded-lg flex items-center justify-center font-mono font-bold text-sm shadow-md shadow-indigo-600/20">
              C
            </span>
            CodeCollab
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/profile"
            className="text-sm font-semibold text-gray-300 hover:text-white transition bg-gray-800/40 hover:bg-gray-800 border border-gray-800 px-4 py-2 rounded-xl"
          >
            👤 Profile & Stats
          </Link>
          <button
            onClick={logout}
            className="text-sm font-semibold text-gray-400 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto pt-16 px-6 relative z-10 space-y-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-extrabold mb-1">
              Welcome back, <span className="gradient-text">{user?.name}</span>
            </h1>
            <p className="text-gray-400 text-sm">Create a new coding room or join an active live share workspace.</p>
          </div>

          {/* Mini-Stats Card */}
          {profileStats && (
            <div className="flex gap-6 bg-gray-900/55 border border-gray-850 p-4 rounded-2xl backdrop-blur-sm">
              <div className="text-center px-4">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Total Runs</span>
                <span className="text-xl font-bold font-mono text-indigo-400">{profileStats.totalExecutions || 0}</span>
              </div>
              <div className="w-px bg-gray-800"></div>
              <div className="text-center px-4">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block">Joined Rooms</span>
                <span className="text-xl font-bold font-mono text-purple-400">{profileStats.roomsJoined?.length || 0}</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm animate-fade-in">
            {error}
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-3 animate-slide-up">
          {/* Quick Actions Panel */}
          <div className="md:col-span-1 space-y-6">
            {/* Create Room */}
            <div className="glass-card p-6 border border-gray-850">
              <h2 className="font-bold text-gray-200 mb-1 flex items-center gap-2">
                <span>🆕</span> Create Room
              </h2>
              <p className="text-xs text-gray-400 mb-4">Start a fresh coding session.</p>
              <input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name (optional)"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 mb-3"
              />
              <button
                onClick={handleCreate}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl py-2.5 transition text-sm shadow-lg shadow-indigo-600/15 active:scale-95"
              >
                Create Room
              </button>
            </div>

            {/* Join Room */}
            <div className="glass-card p-6 border border-gray-850">
              <h2 className="font-bold text-gray-200 mb-1 flex items-center gap-2">
                <span>🔗</span> Join Room
              </h2>
              <p className="text-xs text-gray-400 mb-4">Enter a live room ID to collaborate.</p>
              <input
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                placeholder="Paste room ID here"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 mb-3"
              />
              <button
                onClick={handleJoin}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl py-2.5 transition text-sm shadow-lg shadow-teal-600/15 active:scale-95"
              >
                Join Session
              </button>
            </div>
          </div>

          {/* Rooms History Panel */}
          <div className="md:col-span-2">
            <div className="glass-card p-6 border border-gray-850 h-full flex flex-col">
              <h2 className="font-bold text-gray-200 mb-1 flex items-center gap-2">
                <span>🕒</span> Recent Rooms
              </h2>
              <p className="text-xs text-gray-400 mb-5">Quick access to workspaces you joined.</p>

              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-500 gap-2">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs">Loading rooms list...</span>
                </div>
              ) : roomsList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-500 italic text-sm">
                  <span>No recent rooms found. Create one to get started!</span>
                </div>
              ) : (
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] pr-1">
                  {roomsList.map((room) => (
                    <div
                      key={room.roomId}
                      onClick={() => navigate(`/editor/${room.roomId}`)}
                      className="bg-gray-950/40 border border-gray-900 hover:border-gray-850 hover:bg-gray-900/60 rounded-2xl p-4 flex justify-between items-center transition cursor-pointer group"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-gray-200 truncate group-hover:text-indigo-400 transition">
                            {room.name}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-800/80 px-2 py-0.5 rounded text-gray-400">
                            {room.language}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-mono truncate">
                          ID: {room.roomId}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-right flex-shrink-0 pl-3">
                        <div className="text-xs text-gray-500">
                          <span className="text-gray-400 font-semibold">{room.participantCount}</span> online
                        </div>
                        <span className="text-gray-600 group-hover:text-gray-300 transition text-lg">
                          →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}