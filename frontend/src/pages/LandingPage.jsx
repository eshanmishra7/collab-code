import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  // If already authenticated, direct to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white bg-grid relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center border-b border-gray-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
            <span className="bg-indigo-600 text-white w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-base shadow-lg shadow-indigo-600/20">
              C
            </span>
            CodeCollab
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-semibold text-gray-300 hover:text-white transition px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-5 py-2.5 transition shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-28 relative z-10 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 px-4 py-1.5 rounded-full text-xs font-semibold text-indigo-300 mb-8 animate-fade-in">
          <span>✨ Real-Time Collaborative Environment</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight max-w-4xl animate-slide-up">
          Real-Time Collaborative Coding{' '}
          <span className="gradient-text">Powered by AI</span>
        </h1>

        {/* Subtitle */}
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed animate-slide-up">
          Write, execute, and debug code simultaneously with your team. Get real-time AI assistance, interview hints, and run support in multiple languages.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-slide-up">
          <Link
            to="/register"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl transition shadow-xl shadow-indigo-600/25 text-base active:scale-95 flex items-center justify-center gap-2"
          >
            Create Your Workspace 🚀
          </Link>
          <Link
            to="/login"
            className="bg-gray-900 hover:bg-gray-800 text-gray-200 border border-gray-800 font-bold px-8 py-4 rounded-xl transition text-base active:scale-95 flex items-center justify-center"
          >
            Join Existing Room
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-8 text-left animate-slide-up">
          {/* Card 1 */}
          <div className="glass-card p-8 flex flex-col gap-4 hover:border-indigo-500/40 transition group hover:shadow-xl hover:shadow-indigo-500/5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-115 transition">
              ⚡
            </div>
            <h3 className="text-lg font-bold text-gray-100">Sync in Real-Time</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Google Docs-like code editing with active cursor tracking, instant updates, language syncing, and in-app chat.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-8 flex flex-col gap-4 hover:border-purple-500/40 transition group hover:shadow-xl hover:shadow-purple-500/5">
            <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-2xl group-hover:scale-115 transition">
              🤖
            </div>
            <h3 className="text-lg font-bold text-gray-100">Integrated AI Assistant</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Unlock GenAI insights. Get complexity assessments, interview hints, optimization ideas, and detailed code explanations.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-8 flex flex-col gap-4 hover:border-emerald-500/40 transition group hover:shadow-xl hover:shadow-emerald-500/5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-2xl group-hover:scale-115 transition">
              🚀
            </div>
            <h3 className="text-lg font-bold text-gray-100">Execute Securely</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Execute programs securely in the cloud. Full stdout/stderr capture with execution timing and history logs.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-8 text-center text-xs text-gray-600 max-w-7xl mx-auto px-6 relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <span>© 2026 CodeCollab. Created for production-quality engineering interviews.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-gray-400">Terms</a>
          <a href="#" className="hover:text-gray-400">Privacy</a>
          <a href="#" className="hover:text-gray-400">Docs</a>
        </div>
      </footer>
    </div>
  );
}
