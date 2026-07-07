export default function OutputPanel({ output, loading }) {
  if (loading) {
    return (
      <div className="p-4 text-gray-400 text-sm flex items-center gap-2">
        <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        Running...
      </div>
    );
  }

  if (!output) {
    return (
      <div className="p-4 text-gray-600 text-sm italic">
        Run your code to see output here
      </div>
    );
  }

  return (
    <div className="p-4 font-mono text-sm overflow-auto h-full">
      {output.stdout && (
        <pre className="text-green-400 whitespace-pre-wrap">{output.stdout}</pre>
      )}
      {output.stderr && (
        <pre className="text-red-400 whitespace-pre-wrap">{output.stderr}</pre>
      )}
      {!output.stdout && !output.stderr && (
        <span className="text-gray-500 italic">No output</span>
      )}
      <div className="text-gray-600 text-xs mt-2">
        Exit code: {output.exitCode}
      </div>
    </div>
  );
}