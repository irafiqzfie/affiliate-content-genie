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
    editorRef.current?.focus();
    updateToolbarState();
  };

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

  useEffect(() => {
    editorRef.current?.focus();
  }, []);

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
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onKeyUp={updateToolbarState}
        onFocus={updateToolbarState}
      />
      <div className="edit-actions">
        <button onClick={onCancel} className="cancel-edit-button">Cancel</button>
        <button onClick={onSave} className="save-edit-button">Save</button>
      </div>
    </div>
  );
};
