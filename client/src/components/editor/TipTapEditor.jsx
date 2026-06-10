import { useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useStore } from '../../store/useStore';
import { getSocket } from '../../socket/socket';

/**
 * Compute a simple diff between two plain-text strings and return
 * an OT-compatible delta: { type: 'insert'|'delete', position, text|length }
 *
 * IMPORTANT: Both oldText and newText must be PLAIN TEXT (not HTML),
 * because the server OT engine operates on plain text.
 */
function computeDelta(oldText, newText) {
  const deltas = [];

  let prefixLen = 0;
  while (
    prefixLen < oldText.length &&
    prefixLen < newText.length &&
    oldText[prefixLen] === newText[prefixLen]
  ) {
    prefixLen++;
  }

  let oldSuffixStart = oldText.length;
  let newSuffixStart = newText.length;
  while (
    oldSuffixStart > prefixLen &&
    newSuffixStart > prefixLen &&
    oldText[oldSuffixStart - 1] === newText[newSuffixStart - 1]
  ) {
    oldSuffixStart--;
    newSuffixStart--;
  }

  const deletedLen = oldSuffixStart - prefixLen;
  const insertedText = newText.slice(prefixLen, newSuffixStart);

  if (deletedLen > 0) {
    deltas.push({ type: 'delete', position: prefixLen, length: deletedLen });
  }
  if (insertedText.length > 0) {
    deltas.push({ type: 'insert', position: prefixLen, text: insertedText });
  }

  return deltas;
}

/**
 * Apply a delta operation to a plain text string.
 */
function applyDelta(text, delta) {
  if (delta.type === 'insert' && delta.text !== undefined) {
    const pos = Math.min(delta.position, text.length);
    return text.slice(0, pos) + delta.text + text.slice(pos);
  } else if (delta.type === 'delete' && delta.length !== undefined) {
    const pos = Math.min(delta.position, text.length);
    const end = Math.min(pos + delta.length, text.length);
    return text.slice(0, pos) + text.slice(end);
  }
  return text;
}

/**
 * Convert plain text to TipTap-compatible HTML paragraphs.
 */
function textToHtml(text) {
  if (!text) return '<p></p>';
  return text
    .split('\n')
    .map((line) => `<p>${line || '<br>'}</p>`)
    .join('');
}

export default function TipTapEditor({ roomId, editorRef }) {
  const setWordCount = useStore((s) => s.setWordCount);
  const setSaveStatus = useStore((s) => s.setSaveStatus);
  const documentData = useStore((s) => s.documentData);
  const connectionStatus = useStore((s) => s.connectionStatus);

  const suppressRef = useRef(false);
  const prevTextRef = useRef('');
  const versionRef = useRef(0);
  const initializedRef = useRef(false);

  const updateWordCount = useCallback(
    (text) => {
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setWordCount(words);
    },
    [setWordCount]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap',
      },
    },
    onUpdate: ({ editor }) => {
      if (suppressRef.current) return;

      // Use plain text for delta computation — the server OT engine
      // operates on plain text, not HTML.
      const newText = editor.getText({ blockSeparator: '\n' });
      updateWordCount(newText);

      const oldText = prevTextRef.current;
      if (oldText === newText) return;

      const deltas = computeDelta(oldText, newText);
      prevTextRef.current = newText;

      const socket = getSocket();
      if (socket?.connected && deltas.length > 0) {
        setSaveStatus('saving');

        for (const delta of deltas) {
          socket.emit('text-delta', {
            roomId,
            delta,
            version: versionRef.current,
          });
          versionRef.current++;
        }
      }
    },
  });

  // Expose editor to parent via ref
  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  // Initialize editor content from document data stored in Zustand.
  // This runs whenever documentData changes (set by useRoom on room-joined),
  // eliminating the race condition where the socket event fired before
  // this component's listeners were registered.
  useEffect(() => {
    if (!editor || !documentData) return;

    // Prevent re-initialization if we already loaded this document
    if (initializedRef.current) return;
    initializedRef.current = true;

    suppressRef.current = true;

    const content = documentData.content || '';
    prevTextRef.current = content;
    versionRef.current = documentData.version || 0;

    console.log('[TipTap] INIT from documentData:', { content: content.slice(0, 100), version: versionRef.current });

    editor.commands.setContent(textToHtml(content), false);

    updateWordCount(content);
    setSaveStatus('saved');

    suppressRef.current = false;
  }, [editor, documentData, updateWordCount, setSaveStatus]);

  // Listen for incoming text-delta and version-conflict socket events.
  // Depends on connectionStatus so that this effect re-runs when the socket
  // transitions to 'connected' — this is critical because React runs children's
  // effects before parents', so getSocket() returns null on the first pass
  // (useRoom hasn't created the socket yet). When useRoom connects and sets
  // connectionStatus='connected', this effect re-runs and registers listeners
  // on the now-available socket.
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !editor || connectionStatus !== 'connected') return;

    const handleDelta = ({ delta, version }) => {
      console.log('[TipTap] RECEIVED text-delta:', { delta, version });
      suppressRef.current = true;

      // Apply delta to our tracked plain text
      const currentText = prevTextRef.current;
      const newText = applyDelta(currentText, delta);
      prevTextRef.current = newText;

      if (version !== undefined) {
        versionRef.current = version;
      }

      // Save cursor position
      const { from, to } = editor.state.selection;

      // Set content as HTML paragraphs from the updated plain text
      editor.commands.setContent(textToHtml(newText), false);

      // Restore cursor as best as possible
      try {
        const maxPos = editor.state.doc.content.size - 1;
        const safeFrom = Math.min(from, maxPos);
        const safeTo = Math.min(to, maxPos);
        editor.commands.setTextSelection({
          from: Math.max(1, safeFrom),
          to: Math.max(1, safeTo),
        });
      } catch (e) {
        // Ignore if cursor position is invalid after edit
      }

      updateWordCount(newText);
      suppressRef.current = false;
    };

    const handleVersionConflict = ({ serverVersion }) => {
      console.warn('[TipTap] VERSION CONFLICT! server:', serverVersion, 'client:', versionRef.current);
      versionRef.current = serverVersion;
    };

    console.log('[TipTap] Registering socket listeners — socket id:', socket.id);
    socket.on('text-delta', handleDelta);
    socket.on('version-conflict', handleVersionConflict);

    return () => {
      console.log('[TipTap] Cleaning up socket listeners');
      socket.off('text-delta', handleDelta);
      socket.off('version-conflict', handleVersionConflict);
    };
  }, [editor, connectionStatus, roomId, updateWordCount]);

  if (!editor) return null;

  return (
    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#FFFFFF' }}>
      <div style={{ maxWidth: '768px', margin: '0 auto', padding: '48px 32px' }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
