import { useState, useRef, useEffect, memo } from 'react';
import { useAuth } from '../../context/AuthContext';

const ChatMessage = memo(({ msg, isOwn }) => (
  <div className={`flex flex-col mb-3 ${isOwn ? 'items-end' : 'items-start'}`}>
    <span className="text-xs text-gray-500 mb-1">{msg.sender.name}</span>
    <div
      className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
        isOwn
          ? 'bg-indigo-600 text-white rounded-tr-sm'
          : 'bg-gray-800 text-gray-200 rounded-tl-sm'
      }`}
    >
      {msg.message}
    </div>
    <span className="text-xs text-gray-600 mt-1">
      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  </div>
));

export default function ChatPanel({ socket, roomId, initialMessages = [] }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('receive-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off('receive-message');
  }, [socket]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socket) return;
    socket.emit('send-message', {
      roomId,
      message: input.trim(),
      senderName: user.name,
    });
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800">
      <div className="px-4 py-3 border-b border-gray-800 text-sm font-medium text-gray-300">
        Room chat
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-gray-600 text-sm text-center mt-8">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg) => (
          <ChatMessage
            key={msg._id || msg.timestamp}
            msg={msg}
            isOwn={msg.sender.userId === user.id}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-gray-800 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-indigo-500 focus:outline-none"
        />
        <button
          onClick={sendMessage}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}