import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import MonacoEditorComponent from '../components/Editor/MonacoEditor';
import ChatPanel from '../components/Chat/ChatPanel';
import AIPanel from '../components/Editor/AIPanel';
import OutputPanel from '../components/Editor/OutputPanel';
import RoomHeader from '../components/Room/RoomHeader';
import api from '../services/api';

const DEBOUNCE_MS = 300;

export default function EditorPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [code, setCode] = useState('// Loading...\n');
  const [language, setLanguage] = useState('javascript');
  const [activeUsers, setActiveUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [outputOpen, setOutputOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('chat'); // 'chat' or 'ai'

  const codeChangeTimer = useRef(null);
  const isRemoteChange = useRef(false);

  // Load room data on mount
  useEffect(() => {
    api.post('/rooms/join', { roomId })
      .then(({ data }) => {
        setCode(data.session?.code || '');
        setLanguage(data.session?.language || 'javascript');
        setMessages(data.messages || []);
      })
      .catch(() => navigate('/dashboard'));
  }, [roomId, navigate]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !user) return;

    socket.emit('join-room', { roomId, userName: user.name });

    socket.on('sync-code', ({ code: c, language: l }) => {
      isRemoteChange.current = true;
      setCode(c);
      setLanguage(l);
    });

    socket.on('code-change', ({ code: c, language: l }) => {
      isRemoteChange.current = true;
      setCode(c);
      if (l) setLanguage(l);
    });

    socket.on('language-change', ({ language: l }) => setLanguage(l));

    socket.on('user-joined', ({ activeUsers: users }) => setActiveUsers(users));
    socket.on('user-left', ({ activeUsers: users }) => setActiveUsers(users));

    return () => {
      socket.emit('leave-room', { roomId });
      socket.off('sync-code');
      socket.off('code-change');
      socket.off('language-change');
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, [socket, user, roomId]);

  // Emit code changes with debounce
  const handleCodeChange = useCallback((newCode) => {
    if (isRemoteChange.current) {
      isRemoteChange.current = false;
      return;
    }

    setCode(newCode);

    clearTimeout(codeChangeTimer.current);
    codeChangeTimer.current = setTimeout(() => {
      socket?.emit('code-change', { roomId, code: newCode, language });
    }, DEBOUNCE_MS);
  }, [socket, roomId, language]);

  const handleLanguageChange = useCallback((lang) => {
    setLanguage(lang);
    socket?.emit('language-change', { roomId, language: lang });
  }, [socket, roomId]);

  const handleCursorChange = useCallback((position) => {
    socket?.emit('cursor-move', { roomId, position });
  }, [socket, roomId]);

  const handleRun = async () => {
    setRunning(true);
    setOutputOpen(true);
    setOutput(null);
    try {
      const { data } = await api.post('/execute', { code, language });
      setOutput(data);
    } catch (err) {
      setOutput({ stdout: '', stderr: err.response?.data?.message || 'Execution failed', exitCode: 1 });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden font-sans">
      <RoomHeader
        roomId={roomId}
        language={language}
        onLanguageChange={handleLanguageChange}
        activeUsers={activeUsers}
        onRun={handleRun}
        running={running}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Editor + Output */}
        <div className="flex flex-col flex-1 min-w-0 bg-gray-950">
          <div className={`flex-1 relative ${outputOpen ? 'h-3/5' : 'h-full'}`}>
            <MonacoEditorComponent
              code={code}
              language={language}
              onChange={handleCodeChange}
              onCursorChange={handleCursorChange}
              remoteUsers={activeUsers}
            />
          </div>

          {outputOpen && (
            <div className="h-2/5 bg-gray-900 border-t border-gray-800 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-950/40">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Console Output</span>
                <button
                  onClick={() => setOutputOpen(false)}
                  className="text-gray-500 hover:text-gray-300 text-lg leading-none transition px-2 py-0.5 rounded"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto bg-gray-900">
                <OutputPanel output={output} loading={running} />
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Chat & AI Tab Container */}
        <div className="w-80 md:w-96 flex-shrink-0 flex flex-col border-l border-gray-800 bg-gray-900 overflow-hidden">
          {/* Tab Selector Header */}
          <div className="flex border-b border-gray-800 bg-gray-950/30">
            <button
              onClick={() => setSidebarTab('chat')}
              className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase transition ${
                sidebarTab === 'chat'
                  ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              💬 Room Chat
            </button>
            <button
              onClick={() => setSidebarTab('ai')}
              className={`flex-1 py-3 text-xs font-bold tracking-wider uppercase transition ${
                sidebarTab === 'ai'
                  ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              🤖 AI Assistant
            </button>
          </div>

          {/* Active Sidebar Component */}
          <div className="flex-1 overflow-hidden">
            {sidebarTab === 'chat' ? (
              <ChatPanel socket={socket} roomId={roomId} initialMessages={messages} />
            ) : (
              <AIPanel code={code} language={language} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}