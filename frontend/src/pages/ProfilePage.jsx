import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function ProfilePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, histRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/execute/history'),
        ]);
        setProfile(meRes.data.user);
        setHistory(histRes.data.executions || []);
      } catch (err) {
        setError('Failed to load profile details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold animate-pulse text-gray-400">Loading profile data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Navigation Header */}
      <nav className="border-b border-gray-900 bg-gray-900/50 px-6 py-4 flex justify-between items-center backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="font-extrabold text-lg text-white hover:opacity-90 transition">
            CodeCollab
          </Link>
          <span className="text-gray-700 font-mono text-sm">/</span>
          <span className="text-gray-400 text-sm font-medium">User Profile</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
            Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-4 py-2 rounded-xl transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-12 px-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Panel: Profile Detail */}
          <div className="glass-card p-6 border border-gray-850 flex flex-col items-center text-center">
            {/* Avatar block */}
            <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-4xl font-extrabold shadow-lg shadow-indigo-600/20 mb-4">
              {profile?.name?.[0]?.toUpperCase()}
            </div>
            <h2 className="text-xl font-bold mb-1 text-gray-100">{profile?.name}</h2>
            <span className="text-sm text-gray-500 mb-6">{profile?.email}</span>

            <div className="w-full h-px bg-gray-850 my-2"></div>

            <div className="w-full text-left space-y-3 pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Member Since:</span>
                <span className="text-gray-300 font-mono">
                  {new Date(profile?.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Rooms Joined:</span>
                <span className="text-gray-300 font-mono">{profile?.roomsJoined?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Analytics & History */}
          <div className="md:col-span-2 space-y-6">
            {/* Coding Stats cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-6 border border-gray-850">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Executions</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-white font-mono">{profile?.totalExecutions || 0}</span>
                  <span className="text-xs text-gray-400">runs</span>
                </div>
              </div>
              <div className="glass-card p-6 border border-gray-850">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined Sessions</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold text-white font-mono">{profile?.roomsJoined?.length || 0}</span>
                  <span className="text-xs text-gray-400">rooms</span>
                </div>
              </div>
            </div>

            {/* Run History List */}
            <div className="glass-card p-6 border border-gray-850">
              <h3 className="font-bold text-gray-200 mb-4 flex items-center justify-between">
                <span>Recent Executions</span>
                <span className="text-xs text-gray-500 font-normal">Last 20 Runs</span>
              </h3>

              {history.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500 italic">
                  No executions logged yet. Start coding in a room!
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-96 pr-2">
                  {history.map((run) => (
                    <div
                      key={run._id}
                      className="bg-gray-950/40 border border-gray-900 rounded-xl p-3.5 flex justify-between items-center text-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-indigo-400 uppercase text-xs bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">
                            {run.language}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                              run.status === 'success'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/10'
                                : run.status === 'timeout'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                                : 'bg-red-500/10 text-red-400 border border-red-500/10'
                            }`}
                          >
                            {run.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(run.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-gray-300 font-semibold block">
                          {run.executionTime} ms
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          Code length: {run.stdout?.length || 0} B
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
