import { useState } from 'react';
import api from '../../services/api';

export default function AIPanel({ code, language }) {
  const [activeTab, setActiveTab] = useState('explain');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Conversational chatbot states
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const features = [
    { id: 'explain', label: 'Explain Code', endpoint: '/ai/explain', icon: '📝' },
    { id: 'bugfix', label: 'Fix Bugs', endpoint: '/ai/bugfix', icon: '🐛' },
    { id: 'optimize', label: 'Optimize', endpoint: '/ai/optimize', icon: '⚡' },
    { id: 'complexity', label: 'Complexity', endpoint: '/ai/complexity', icon: '📊' },
    { id: 'hints', label: 'Interview Hints', endpoint: '/ai/interview-hints', icon: '💡' },
    { id: 'chat', label: 'AI Chatbot', endpoint: '/ai/chat', icon: '💬' },
  ];

  const triggerAI = async (endpoint, tabId) => {
    setError('');
    setResult(null);
    setActiveTab(tabId);

    if (tabId === 'chat') {
      setResult({}); // Set dummy to bypass the empty state view
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(endpoint, { code, language });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get AI assistance');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = { sender: 'user', text: chatInput.trim() };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const { data } = await api.post('/ai/chat', {
        code,
        language,
        message: userMessage.text,
        history: chatHistory,
      });

      setChatHistory((prev) => [...prev, { sender: 'ai', text: data.text }]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        { sender: 'ai', text: 'Error: Failed to fetch reply from Llama-3.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium animate-pulse">AI is thinking...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
          {error}
        </div>
      );
    }

    if (!result) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-gray-500">
          <div className="text-4xl mb-3">🤖</div>
          <p className="text-sm font-medium mb-1 text-gray-300">Select an AI action</p>
          <p className="text-xs max-w-xs">Get instant explanations, complexity analyses, interview hints, and optimization advice for your code.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'chat':
        return (
          <div className="flex flex-col h-full justify-between">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 max-h-[380px] md:max-h-[460px]">
              {chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500">
                  <span className="text-3xl mb-2">💬</span>
                  <p className="text-sm font-semibold text-gray-400 mb-1">AI Coding Chatbot</p>
                  <p className="text-xs max-w-xs">Ask anything about the current code. I can spot logic issues, explain patterns, or help you refactor.</p>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white self-end ml-auto rounded-tr-none'
                        : 'bg-gray-800 text-gray-200 self-start mr-auto rounded-tl-none border border-gray-700/40'
                    }`}
                  >
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">
                      {msg.sender === 'user' ? 'You' : 'Llama-3 Assistant'}
                    </span>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ))
              )}

              {chatLoading && (
                <div className="bg-gray-805 text-gray-400 self-start mr-auto rounded-2xl p-3 text-xs flex items-center gap-2 border border-gray-850">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleChatSend} className="flex gap-2 pt-3 border-t border-gray-800 bg-gray-900">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask chatbot about your code..."
                className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-3 py-2 rounded-xl text-xs transition active:scale-95"
              >
                Send
              </button>
            </form>
          </div>
        );

      case 'explain':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Explanation</span>
              <button
                onClick={() => handleCopy(result.explanation)}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded transition"
              >
                Copy Explanation
              </button>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
              {result.explanation}
            </div>
            {result.confidence && (
              <div className="text-xs text-gray-500 text-right">
                Confidence Score: {(result.confidence * 100).toFixed(0)}%
              </div>
            )}
          </div>
        );

      case 'bugfix':
        return (
          <div className="space-y-4 animate-fade-in">
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block">Bug Fix Suggestions</span>
            <div className="space-y-2">
              {result.suggestions?.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex gap-3 text-sm ${
                    item.severity === 'error'
                      ? 'bg-red-500/10 border-red-500/20 text-red-300'
                      : item.severity === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                      : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                  }`}
                >
                  <span className="text-lg">
                    {item.severity === 'error' ? '🚫' : item.severity === 'warning' ? '⚠️' : 'ℹ️'}
                  </span>
                  <div>
                    <span className="font-semibold block capitalize mb-0.5 text-xs text-gray-400">{item.severity}</span>
                    <p className="leading-relaxed">{item.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'optimize':
        return (
          <div className="space-y-4 animate-fade-in">
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block">Optimizations</span>
            <div className="space-y-3">
              {result.optimizations?.map((opt, idx) => (
                <div key={idx} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{opt.area}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        opt.impact === 'high'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                          : opt.impact === 'medium'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                          : 'bg-green-500/15 text-green-400 border border-green-500/20'
                      }`}
                    >
                      {opt.impact} impact
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{opt.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'complexity':
        return (
          <div className="space-y-4 animate-fade-in">
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block">Complexity Analysis</span>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                <span className="text-xs text-gray-500 block mb-1">Time Complexity</span>
                <span className="text-sm font-mono font-bold text-indigo-300">{result.timeComplexity}</span>
              </div>
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                <span className="text-xs text-gray-500 block mb-1">Space Complexity</span>
                <span className="text-sm font-mono font-bold text-indigo-300">{result.spaceComplexity}</span>
              </div>
            </div>
            {result.details && (
              <div className="bg-gray-900/40 border border-gray-800/80 rounded-xl p-4 text-xs space-y-2">
                <span className="font-semibold text-gray-400 block mb-1">Code Metrics</span>
                <div className="flex justify-between">
                  <span className="text-gray-500">Loops:</span>
                  <span className="font-mono text-gray-300">{result.details.loops}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Nested Loops:</span>
                  <span className="font-mono text-gray-300">{result.details.nestedLoops}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Recursive Calls:</span>
                  <span className="font-mono text-gray-300">{result.details.recursivePatterns}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Code Lines:</span>
                  <span className="font-mono text-gray-300">{result.details.totalLines}</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'hints':
        return (
          <div className="space-y-4 animate-fade-in">
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider block">Interview Hints</span>
            <div className="space-y-2.5">
              {result.hints?.map((hint, idx) => (
                <div
                  key={idx}
                  className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-4 text-sm text-gray-300 flex gap-3"
                >
                  <span className="text-indigo-400 mt-0.5">•</span>
                  <p className="leading-relaxed whitespace-pre-wrap">{hint.replace(/\*\*/g, '')}</p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-800 overflow-hidden">
      {/* AI Assistant Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2 bg-gray-900 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-200">AI Assistant</span>
        <span className="bg-indigo-600/10 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-indigo-500/20">
          GenAI v2.1
        </span>
      </div>

      {/* Action Tabs/Buttons Grid */}
      <div className="p-3 border-b border-gray-800 bg-gray-950/20 grid grid-cols-6 gap-1 flex-shrink-0">
        {features.map((f) => (
          <button
            key={f.id}
            title={f.label}
            onClick={() => triggerAI(f.endpoint, f.id)}
            className={`py-2 text-sm rounded-lg flex flex-col items-center justify-center transition border ${
              activeTab === f.id && result
                ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-300 shadow-sm shadow-indigo-500/5'
                : 'bg-gray-900/40 border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            <span className="text-base mb-0.5">{f.icon}</span>
            <span className="text-[8px] font-medium tracking-tight truncate max-w-full px-0.5">
              {f.id === 'complexity' ? 'Complex' : f.id === 'hints' ? 'Hints' : f.id === 'bugfix' ? 'Bugs' : f.label.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 p-4 bg-gray-950/10 overflow-hidden ${activeTab === 'chat' ? 'flex flex-col' : 'overflow-y-auto'}`}>
        {renderContent()}
      </div>
    </div>
  );
}
