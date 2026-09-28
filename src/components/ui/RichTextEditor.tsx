'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Bold, Italic, Highlighter, Eraser } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

// Convert any markdown formatting in raw text into clean HTML for the Google Docs-style editor
function markdownToHtml(raw: string): string {
  if (!raw) return '';
  
  // If it already contains HTML tags like <mark>, <em>, <strong>, <p>, <b>, <i>, <span style...>, return as is
  if (/<(mark|strong|b|em|i|p|span|br)/i.test(raw)) {
    return raw;
  }

  let html = raw;
  // Highlights: ==text== -> <mark>text</mark>
  html = html.replace(/==([\s\S]+?)==/g, '<mark style="background-color: #fef08a; color: #78350f; padding: 2px 5px; border-radius: 4px; font-weight: 500;">$1</mark>');
  // Bold: **text** -> <strong>text</strong>
  html = html.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* or _text_ -> <em>$1</em>
  html = html.replace(/\*([\s\S]+?)\*/g, '<em>$1</em>');
  html = html.replace(/_([\s\S]+?)_/g, '<em>$1</em>');
  // Line breaks to <br>
  html = html.replace(/\n/g, '<br>');

  return html;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Describe the meal ingredients and flavors...',
  minHeight = '110px',
  className = '',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!value);

  // Sync external value to contenteditable innerHTML when mounting or resetting
  useEffect(() => {
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const targetHtml = markdownToHtml(value || '');

    if (currentHtml !== targetHtml && (currentHtml === '' || value === '')) {
      editorRef.current.innerHTML = targetHtml;
      setIsEmpty(!editorRef.current.innerText.trim());
    }
  }, [value]);

  // Initial load
  useEffect(() => {
    if (editorRef.current && value) {
      editorRef.current.innerHTML = markdownToHtml(value);
      setIsEmpty(!editorRef.current.innerText.trim());
    }
  }, []);

  // Update active state of toolbar buttons based on selection
  const updateToolbarState = useCallback(() => {
    if (!editorRef.current) return;
    try {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const node = sel.anchorNode;
        const parentMark = node?.parentElement?.closest('mark, [style*="background-color"], span[style*="background"]');
        setIsHighlighted(!!parentMark);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText.trim();
    setIsEmpty(!text);
    onChange(html);
    updateToolbarState();
  };

  const executeCommand = (cmd: string, arg: string | undefined = undefined) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    handleInput();
    updateToolbarState();
  };

  // Google Docs-style Highlight toggle (allows combining Bold + Italic + Highlight simultaneously)
  const toggleHighlight = () => {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const parentMark = range.commonAncestorContainer.parentElement?.closest('mark, span[style*="background"]');

    if (parentMark) {
      // Remove highlight: unwrap mark or remove background color
      if (parentMark.tagName.toLowerCase() === 'mark') {
        const parent = parentMark.parentNode;
        while (parentMark.firstChild) {
          parent?.insertBefore(parentMark.firstChild, parentMark);
        }
        parent?.removeChild(parentMark);
      } else {
        (parentMark as HTMLElement).style.backgroundColor = '';
        (parentMark as HTMLElement).style.color = '';
      }
      handleInput();
      updateToolbarState();
      return;
    }

    if (!selection.isCollapsed) {
      // Try native hiliteColor / backColor
      let success = false;
      try {
        success = document.execCommand('hiliteColor', false, '#fef08a');
        if (!success) {
          success = document.execCommand('backColor', false, '#fef08a');
        }
      } catch {
        success = false;
      }

      if (!success) {
        // Fallback: wrap range in styled mark element
        const mark = document.createElement('mark');
        mark.style.backgroundColor = '#fef08a';
        mark.style.color = '#78350f';
        mark.style.padding = '2px 5px';
        mark.style.borderRadius = '4px';
        mark.style.fontWeight = '500';
        try {
          mark.appendChild(range.extractContents());
          range.insertNode(mark);
          selection.removeAllRanges();
          const newRange = document.createRange();
          newRange.selectNodeContents(mark);
          selection.addRange(newRange);
        } catch {
          // ignore
        }
      }
    } else {
      document.execCommand('hiliteColor', false, '#fef08a');
    }
    handleInput();
    updateToolbarState();
  };

  const removeFormatting = () => {
    editorRef.current?.focus();
    document.execCommand('removeFormat', false);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const parentMark = range.commonAncestorContainer.parentElement?.closest('mark, span[style*="background"]');
      if (parentMark) {
        const parent = parentMark.parentNode;
        while (parentMark.firstChild) {
          parent?.insertBefore(parentMark.firstChild, parentMark);
        }
        parent?.removeChild(parentMark);
      }
    }
    handleInput();
    updateToolbarState();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        executeCommand('bold');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        executeCommand('italic');
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        toggleHighlight();
      }
    }
  };

  return (
    <div className={`rounded-2xl border border-stone-200 bg-white shadow-2xs overflow-hidden focus-within:border-stone-400 focus-within:ring-2 focus-within:ring-stone-200 transition-all ${className}`}>
      {/* Google Docs-style Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50/90 border-b border-stone-200/80 select-none">
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          title="Bold (Cmd+B)"
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            isBold
              ? 'bg-stone-200 text-stone-900 shadow-2xs ring-1 ring-stone-300'
              : 'text-stone-700 hover:bg-stone-200/60 hover:text-stone-900'
          }`}
        >
          <Bold className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Bold</span>
        </button>

        <button
          type="button"
          onClick={() => executeCommand('italic')}
          title="Italic (Cmd+I)"
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            isItalic
              ? 'bg-stone-200 text-stone-900 shadow-2xs ring-1 ring-stone-300'
              : 'text-stone-700 hover:bg-stone-200/60 hover:text-stone-900'
          }`}
        >
          <Italic className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Italic</span>
        </button>

        <div className="w-[1px] h-4 bg-stone-300 mx-0.5" />

        <button
          type="button"
          onClick={toggleHighlight}
          title="Highlight Text (Cmd+H)"
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            isHighlighted
              ? 'bg-amber-200 text-amber-950 ring-1 ring-amber-400 shadow-2xs'
              : 'text-amber-900 bg-amber-50 hover:bg-amber-100 hover:text-amber-950 border border-amber-200/70'
          }`}
        >
          <Highlighter className="w-3.5 h-3.5 text-amber-700" />
          <span>Highlight</span>
        </button>

        <div className="w-[1px] h-4 bg-stone-300 mx-0.5" />

        <button
          type="button"
          onClick={removeFormatting}
          title="Clear Formatting"
          className="p-1.5 rounded-lg text-xs text-stone-500 hover:bg-stone-200/60 hover:text-stone-800 transition-all ml-auto flex items-center gap-1"
        >
          <Eraser className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium hidden sm:inline">Clear</span>
        </button>
      </div>

      {/* Interactive Google Docs-style contentEditable editing area */}
      <div className="relative p-3.5">
        {isEmpty && (
          <div className="absolute top-3.5 left-3.5 text-stone-400 text-sm pointer-events-none select-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBlur={handleInput}
          onKeyUp={updateToolbarState}
          onMouseUp={updateToolbarState}
          onKeyDown={handleKeyDown}
          style={{ minHeight }}
          className="outline-none text-sm text-stone-800 leading-relaxed font-normal [&_mark]:bg-amber-100 [&_mark]:text-amber-950 [&_mark]:px-1.5 [&_mark]:py-0.5 [&_mark]:rounded [&_mark]:font-medium [&_mark]:inline-block [&_mark]:my-0.5 [&_strong]:font-bold [&_strong]:text-stone-900 [&_b]:font-bold [&_b]:text-stone-900 [&_em]:italic [&_em]:text-stone-800 [&_i]:italic [&_i]:text-stone-800"
        />
      </div>
    </div>
  );
}
