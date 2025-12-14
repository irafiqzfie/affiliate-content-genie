"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const RichTextEditorComponent: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  onSave, 
  onCancel 
}) => {
  const [activeFormats, setActiveFormats] = useState(new Set<string>());
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      // Debounce onChange to prevent excessive re-renders
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
      changeTimeoutRef.current = setTimeout(() => {
        if (editorRef.current) {
          onChange(editorRef.current.innerHTML);
        }
      }, 100);
    }
    updateToolbarState();
  };

  // Initialize content only once
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && !isInitializedRef.current) {
      editor.innerHTML = value;
      isInitializedRef.current = true;
      
      // Focus and position cursor at end
      setTimeout(() => {
        if (editor) {
          editor.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          
          // Move cursor to the end
          if (sel) {
            range.selectNodeContents(editor);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      }, 50);
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
    // Debounce onChange to prevent cursor jumping from re-renders
    if (changeTimeoutRef.current) {
      clearTimeout(changeTimeoutRef.current);
    }
    changeTimeoutRef.current = setTimeout(() => {
      onChange(e.currentTarget.innerHTML);
    }, 150);
  }, [onChange]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
    };
  }, []);

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

// Memoize to prevent re-renders when parent updates
export const RichTextEditor = React.memo(RichTextEditorComponent);
