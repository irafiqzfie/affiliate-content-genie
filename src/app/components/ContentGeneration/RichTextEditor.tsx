"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  onSave, 
  onCancel 
}) => {
  const [activeFormats, setActiveFormats] = useState(new Set<string>());
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const initialValueRef = useRef(value); // Store initial value

  const updateToolbarState = useCallback(() => {
    const newFormats = new Set<string>();
    if (document.queryCommandState('bold')) newFormats.add('bold');
    if (document.queryCommandState('italic')) newFormats.add('italic');
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let node: Node | null = selection.getRangeAt(0).startContainer;
      while (node && node.parentNode) {
        if (node.nodeName === 'LI' || node.nodeName === 'UL') {
          newFormats.add('ul');
          break;
        }
        if (node === editorRef.current) break;
        node = node.parentNode;
      }
    }
    setActiveFormats(newFormats);
  }, []);

  const applyFormat = (command: string) => {
    document.execCommand(command, false, undefined);
    if (editorRef.current) {
      editorRef.current.focus();
      // Trigger onChange immediately after format to capture content
      requestAnimationFrame(() => {
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      });
    }
    updateToolbarState();
  };

  // Initialize content only once - make this truly uncontrolled
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && !isInitializedRef.current) {
      editor.innerHTML = initialValueRef.current;
      isInitializedRef.current = true;
      // Focus at the end of content
      requestAnimationFrame(() => {
        if (editor) {
          editor.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          if (editor.childNodes.length > 0) {
            const lastNode = editor.childNodes[editor.childNodes.length - 1];
            range.setStartAfter(lastNode);
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }
      });
    }
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      const handleSelectionChange = () => {
        updateToolbarState();
      };
      document.addEventListener('selectionchange', handleSelectionChange);
      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
      };
    }
  }, [updateToolbarState]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    onChange(e.currentTarget.innerHTML);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle keyboard shortcuts
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }, [onSave, onCancel]);

  return (
    <div className="edit-area">
      <div className="rte-toolbar">
        <button 
          type="button" 
          onClick={() => applyFormat('bold')} 
          className={`rte-button ${activeFormats.has('bold') ? 'active' : ''}`} 
          aria-pressed={activeFormats.has('bold')} 
          aria-label="Bold"
        >
          <b>B</b>
        </button>
        <button 
          type="button" 
          onClick={() => applyFormat('italic')} 
          className={`rte-button ${activeFormats.has('italic') ? 'active' : ''}`} 
          aria-pressed={activeFormats.has('italic')} 
          aria-label="Italic"
        >
          <i>I</i>
        </button>
        <button 
          type="button" 
          onClick={() => applyFormat('insertUnorderedList')} 
          className={`rte-button ${activeFormats.has('ul') ? 'active' : ''}`} 
          aria-pressed={activeFormats.has('ul')} 
          aria-label="Bulleted List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
          </svg>
        </button>
      </div>
      <div
        ref={editorRef}
        className="editable-div"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={updateToolbarState}
        onFocus={updateToolbarState}
        onKeyDown={handleKeyDown}
      />
      <div className="edit-actions">
        <button onClick={onCancel} className="cancel-edit-button">Cancel</button>
        <button onClick={onSave} className="save-edit-button">Save</button>
        <span className="edit-hint">Ctrl+Enter to save • Esc to cancel</span>
      </div>
    </div>
  );
};
