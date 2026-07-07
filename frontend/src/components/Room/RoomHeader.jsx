import { useState } from 'react';
import ActiveUsers from './ActiveUsers';
import LanguageSelector from '../Editor/LanguageSelector';

export default function RoomHeader({ roomId, language, onLanguageChange, activeUsers, onRun, running }) {
  const [copied, setCopied] = useState(false);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Room:</span>
        <span className="text-xs text-gray-300 font-mono">{roomId.slice(0, 12)}...</span>
        <button
          onClick={copyRoomId}
          className="text-xs text-indigo-400 hover:text-indigo-300 transition"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="h-4 w-px bg-gray-800" />

      <LanguageSelector value={language} onChange={onLanguageChange} />

      <div className="flex-1" />

      <ActiveUsers users={activeUsers} />

      <button
        onClick={onRun}
        disabled={running}
        className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition flex items-center gap-2"
      >
        {running ? (
          <>
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Running
          </>
        ) : (
          '▶ Run'
        )}
      </button>
    </div>
  );
}