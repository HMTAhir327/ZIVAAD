'use client';

import { useEffect, useMemo, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  minHeightClassName?: string;
}

interface ToolbarButton {
  label: string;
  command: string;
  value?: string;
}

const TOOLBAR: ToolbarButton[] = [
  { label: 'B', command: 'bold' },
  { label: 'I', command: 'italic' },
  { label: 'U', command: 'underline' },
  { label: 'H3', command: 'formatBlock', value: 'h3' },
  { label: 'H4', command: 'formatBlock', value: 'h4' },
  { label: '• List', command: 'insertUnorderedList' },
  { label: '1. List', command: 'insertOrderedList' },
  { label: '" Quote', command: 'formatBlock', value: 'blockquote' }
];

export function RichTextEditor({
  value,
  onChange,
  minHeightClassName = 'min-h-[220px]'
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const normalizedValue = useMemo(() => value || '', [value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    if (editor.innerHTML !== normalizedValue) {
      editor.innerHTML = normalizedValue;
    }
  }, [normalizedValue]);

  function emitChange() {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    onChange(editor.innerHTML);
  }

  function runCommand(command: string, commandValue?: string) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  }

  function handleLink() {
    const url = window.prompt('Enter URL (https://...)');
    if (!url) {
      return;
    }

    runCommand('createLink', url);
  }

  function clearFormatting() {
    runCommand('removeFormat');
  }

  return (
    <div className="border border-stone-300 bg-white">
      <div className="flex flex-wrap gap-1 border-b border-stone-200 bg-stone-50 p-2">
        {TOOLBAR.map((button) => (
          <button
            key={`${button.command}-${button.label}`}
            type="button"
            onClick={() => runCommand(button.command, button.value)}
            className="border border-stone-300 px-2 py-1 text-[10px] uppercase tracking-luxury text-stone-700 hover:border-stone-950 hover:text-stone-950"
          >
            {button.label}
          </button>
        ))}
        <button
          type="button"
          onClick={handleLink}
          className="border border-stone-300 px-2 py-1 text-[10px] uppercase tracking-luxury text-stone-700 hover:border-stone-950 hover:text-stone-950"
        >
          Link
        </button>
        <button
          type="button"
          onClick={() => runCommand('unlink')}
          className="border border-stone-300 px-2 py-1 text-[10px] uppercase tracking-luxury text-stone-700 hover:border-stone-950 hover:text-stone-950"
        >
          Unlink
        </button>
        <button
          type="button"
          onClick={clearFormatting}
          className="border border-stone-300 px-2 py-1 text-[10px] uppercase tracking-luxury text-stone-700 hover:border-stone-950 hover:text-stone-950"
        >
          Clear
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        className={`${minHeightClassName} w-full p-4 text-sm leading-relaxed text-stone-800 outline-none [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-stone-300 [&_blockquote]:pl-3 [&_h3]:font-serif [&_h3]:text-2xl [&_h4]:font-serif [&_h4]:text-xl [&_li]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_ul]:list-disc`}
      />
    </div>
  );
}

