import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const LANGUAGE_MAP = {
  javascript: 'javascript',
  python: 'python',
  cpp: 'cpp',
  java: 'java',
};

export default function MonacoEditorComponent({
  code,
  language,
  onChange,
  onCursorChange,
  remoteUsers = [],
  readOnly = false,
}) {
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  // Update remote cursor decorations
  useEffect(() => {
    if (!editorRef.current || !window.monaco) return;

    const newDecorations = remoteUsers
      .filter((u) => u.cursor)
      .map((u) => ({
        range: new window.monaco.Range(
          u.cursor.lineNumber,
          u.cursor.column,
          u.cursor.lineNumber,
          u.cursor.column + 1
        ),
        options: {
          className: 'remote-cursor',
          afterContentClassName: 'remote-cursor-label',
          stickiness: 1,
          before: {
            content: `"${u.name}"`,
            backgroundColor: u.color || '#4f46e5',
            color: '#fff',
            fontSize: '11px',
            padding: '0 4px',
            borderRadius: '2px',
          },
        },
      }));

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [remoteUsers]);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;

    editor.onDidChangeCursorPosition((e) => {
      onCursorChange?.({
        lineNumber: e.position.lineNumber,
        column: e.position.column,
      });
    });
  };

  return (
    <Editor
      height="100%"
      language={LANGUAGE_MAP[language] || 'javascript'}
      value={code}
      theme="vs-dark"
      onChange={(val) => onChange?.(val || '')}
      onMount={handleEditorDidMount}
      options={{
        readOnly,
        fontSize: 14,
        minimap: { enabled: false },
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        tabSize: 2,
        formatOnPaste: true,
        automaticLayout: true,
      }}
    />
  );
}