import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import Quill from 'quill';

const BlockEmbed = Quill.import('blots/block/embed') as any;
class PageBreakBlot extends BlockEmbed {
  static create(value: any) {
    const node = super.create(value) as HTMLElement;
    node.setAttribute('class', 'page-break');
    node.setAttribute('contenteditable', 'false');
    return node;
  }
}
PageBreakBlot.blotName = 'pageBreak';
PageBreakBlot.tagName = 'hr';
Quill.register(PageBreakBlot);

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onWordCount?: (count: number) => void;
  onImageSelect?: (img: HTMLImageElement | null) => void;
}

export interface EditorHandle {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  insertDate: () => void;
  insertPageBreak: () => void;
  setDirection: (direction: 'rtl' | 'ltr') => void;
  setReadOnly: (readOnly: boolean) => void;
  getHtml: () => string;
  setHtml: (html: string) => void;
  format: (name: string, value: any) => void;
  getSelectionText: () => string;
  getSelectionHtml: () => string;
  replaceSelectionHtml: (html: string) => void;
  insertHtmlAtCursor: (html: string) => void;
}

const Editor = forwardRef<EditorHandle, EditorProps>(({ value, onChange, onWordCount, onImageSelect }, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<Quill | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const lastSelection = useRef<any>(null);

  useEffect(() => {
    if (editorRef.current && !quillInstance.current) {
      quillInstance.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: false,
          history: {
            delay: 500,
            maxStack: 100,
            userOnly: true
          }
        }
      });

      const Delta = Quill.import('delta') as any;
      quillInstance.current.clipboard.addMatcher('hr', (node: HTMLElement) => {
        return new Delta().insert({ pageBreak: true });
      });
      quillInstance.current.clipboard.addMatcher('.page-break', (node: HTMLElement) => {
        return new Delta().insert({ pageBreak: true });
      });

      quillInstance.current.on('text-change', () => {
        const text = quillInstance.current?.getText() || '';
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        onChange(quillInstance.current?.root.innerHTML || '');
        if (onWordCount) onWordCount(words);
      });

      quillInstance.current.on('selection-change', (range) => {
        if (range) {
          lastSelection.current = range;

          // Calculate active page number dynamically based on cursor position
          try {
            const editorRoot = quillInstance.current?.root;
            if (editorRoot) {
              const [leaf] = quillInstance.current!.getLeaf(range.index);
              if (leaf && leaf.domNode) {
                let domNode = leaf.domNode;
                // Walk up to find the top level block under editorRoot
                while (domNode.parentNode && domNode.parentNode !== editorRoot) {
                  domNode = domNode.parentNode;
                }
                
                // Now find how many page breaks are before this domNode
                const allNodes = Array.from(editorRoot.childNodes);
                const nodeIndex = allNodes.indexOf(domNode as any);
                if (nodeIndex !== -1) {
                  let pageBreaksBefore = 0;
                  for (let i = 0; i < nodeIndex; i++) {
                    const child = allNodes[i];
                    if (child instanceof HTMLElement && (child.classList.contains('page-break') || child.tagName === 'HR')) {
                      pageBreaksBefore++;
                    }
                  }
                  const activePage = pageBreaksBefore + 1;
                  const event = new CustomEvent('editor-active-page-change', { detail: { activePage } });
                  window.dispatchEvent(event);
                }
              }
            }
          } catch (err) {
            console.error("Error calculating active page:", err);
          }
        }
      });

      quillInstance.current.root.addEventListener('click', (e) => {
        if (e.target && (e.target as HTMLElement).tagName === 'IMG') {
          if (onImageSelect) onImageSelect(e.target as HTMLImageElement);
        } else {
          if (onImageSelect) onImageSelect(null);
        }
      });
    }
  }, [onChange, onWordCount, onImageSelect]);

  useEffect(() => {
    if (quillInstance.current && quillInstance.current.root.innerHTML !== value) {
      const currentContent = quillInstance.current.root.innerHTML;
      if (currentContent !== value) {
        quillInstance.current.clipboard.dangerouslyPasteHTML(value);
      }
    }
  }, [value]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && quillInstance.current) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const range = quillInstance.current?.getSelection(true);
        if (range && range.index >= 0) {
          quillInstance.current?.insertEmbed(range.index, 'image', base64, Quill.sources.USER);
          quillInstance.current?.setSelection(range.index + 1, Quill.sources.SILENT);
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  useImperativeHandle(ref, () => ({
    undo: () => {
      quillInstance.current?.focus();
      quillInstance.current?.history.undo();
    },
    redo: () => {
      quillInstance.current?.focus();
      quillInstance.current?.history.redo();
    },
    clear: () => {
      quillInstance.current?.setText('');
      onChange('');
    },
    insertDate: () => {
      quillInstance.current?.focus();
      const date = new Date().toLocaleString();
      const range = quillInstance.current?.getSelection(true);
      if (range && range.index >= 0) {
        quillInstance.current?.insertText(range.index, date);
      }
    },
    insertPageBreak: () => {
      quillInstance.current?.focus();
      const range = quillInstance.current?.getSelection(true);
      if (range && range.index >= 0) {
        quillInstance.current?.insertEmbed(range.index, 'pageBreak', true, Quill.sources.USER);
        quillInstance.current?.insertText(range.index + 1, '\n', Quill.sources.USER);
        quillInstance.current?.setSelection(range.index + 2, Quill.sources.SILENT);
      }
    },
    setDirection: (direction: 'rtl' | 'ltr') => {
      quillInstance.current?.focus();
      quillInstance.current?.format('direction', direction === 'rtl' ? 'rtl' : false);
      quillInstance.current?.format('align', direction === 'rtl' ? 'right' : 'left');
    },
    setReadOnly: (readOnly: boolean) => {
      quillInstance.current?.enable(!readOnly);
    },
    getHtml: () => quillInstance.current?.root.innerHTML || '',
    setHtml: (html: string) => {
      if (quillInstance.current) {
        quillInstance.current.clipboard.dangerouslyPasteHTML(html);
        onChange(quillInstance.current.root.innerHTML);
      }
    },
    format: (name: string, value: any) => {
      quillInstance.current?.focus();
      if (name === 'clean') {
        const range = quillInstance.current?.getSelection(true);
        if (range && range.index >= 0) {
          quillInstance.current?.removeFormat(range.index, range.length);
        }
      } else if (name === 'image') {
        if (value === true) {
          imageInputRef.current?.click();
        } else if (typeof value === 'string') {
          const range = quillInstance.current?.getSelection(true);
          if (range && range.index >= 0) {
            quillInstance.current?.insertEmbed(range.index, 'image', value);
          }
        }
      } else if (name === 'link') {
        const url = prompt('Enter link URL:');
        if (url) {
          quillInstance.current?.format('link', url);
        }
      } else if (name === 'pageBreak') {
        const range = quillInstance.current?.getSelection(true);
        if (range && range.index >= 0) {
          quillInstance.current?.insertEmbed(range.index, 'pageBreak', true, Quill.sources.USER);
          quillInstance.current?.insertText(range.index + 1, '\n', Quill.sources.USER);
          quillInstance.current?.setSelection(range.index + 2, Quill.sources.SILENT);
        }
      } else if (name === 'table') {
        const range = quillInstance.current?.getSelection(true);
        if (range && range.index >= 0) {
          // Basic HTML table insertion as Quill doesn't support tables natively well without modules
          const tableHtml = '<table border="1" style="width:100%; border-collapse: collapse;"><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></table><p><br></p>';
          quillInstance.current?.clipboard.dangerouslyPasteHTML(range.index, tableHtml);
        }
      } else {
        quillInstance.current?.format(name, value);
      }
    },
    getSelectionText: () => {
      let range = quillInstance.current?.getSelection();
      if (!range || range.length === 0) range = lastSelection.current;
      if (range && range.length > 0) {
        return quillInstance.current?.getText(range.index, range.length) || '';
      }
      return '';
    },
    getSelectionHtml: () => {
      let range = quillInstance.current?.getSelection();
      if (!range || range.length === 0) range = lastSelection.current;
      if (range && range.length > 0) {
        const contents = quillInstance.current?.getContents(range.index, range.length);
        if (contents) {
            const tempQuill = new Quill(document.createElement('div'));
            tempQuill.setContents(contents);
            return tempQuill.root.innerHTML;
        }
      }
      return '';
    },
    replaceSelectionHtml: (html: string) => {
      let range = quillInstance.current?.getSelection();
      if (!range) range = lastSelection.current;
      if (range && range.length > 0) {
        quillInstance.current?.deleteText(range.index, range.length);
        quillInstance.current?.clipboard.dangerouslyPasteHTML(range.index, html);
      } else if (range) {
         quillInstance.current?.clipboard.dangerouslyPasteHTML(range.index, html);
      } else {
        const length = quillInstance.current?.getLength() || 0;
        quillInstance.current?.clipboard.dangerouslyPasteHTML(length, html);
      }
    },
    insertHtmlAtCursor: (html: string) => {
      let range = quillInstance.current?.getSelection();
      if (!range) range = lastSelection.current;
      if (range) {
        quillInstance.current?.clipboard.dangerouslyPasteHTML(range.index + range.length, html);
      } else {
        // Fallback to inserting at the end
        const length = quillInstance.current?.getLength() || 0;
        quillInstance.current?.clipboard.dangerouslyPasteHTML(length, html);
      }
    }
  }), [onChange]);

  return (
    <>
      <style>{`
        .ql-container.ql-snow {
          border: none !important;
          background-color: transparent;
          font-family: 'Cairo', 'Inter', sans-serif;
          font-size: 14pt;
        }
        .ql-editor {
          padding: 0 !important;
          min-height: 100%;
          overflow: visible !important;
          line-height: 1.5;
        }
        .ql-editor h1, .ql-editor h2, .ql-editor h3, .ql-editor h4, .ql-editor h5, .ql-editor h6 {
          font-family: 'Cairo', 'Inter', sans-serif;
          font-weight: 700;
          direction: rtl;
          text-align: right;
          margin-bottom: 0.5em;
          line-height: 1.3;
          margin-top: 1em;
        }
        .ql-editor h1 { font-size: 2.25rem; }
        .ql-editor h2 { font-size: 1.875rem; }
        .ql-editor h3 { font-size: 1.5rem; }
        .ql-editor h4 { font-size: 1.25rem; }
        .ql-editor h5 { font-size: 1.125rem; }
        .ql-editor h6 { font-size: 1rem; }
        .ql-editor p {
          margin-bottom: 1em;
        }
        .ql-editor.ql-blank::before {
          right: 0 !important;
          left: auto !important;
          font-style: normal;
          color: #94a3b8;
          content: 'ابدأ بالكتابة هنا...';
          direction: rtl;
          text-align: right;
        }
        .ql-editor.hide-page-breaks .page-break {
          border: none !important;
          margin: 0 !important;
          height: 0 !important;
          page-break-after: always !important;
          opacity: 0;
        }
        .page-break {
          display: block;
          height: 32px;
          background-color: #f1f5f9;
          border: none;
          margin: 2rem -8rem;
          position: relative;
          user-select: none;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.06), 0 -1px 0 rgba(0,0,0,0.05), 0 1px 0 rgba(0,0,0,0.05);
        }
        @media (max-width: 640px) {
          .page-break { margin: 2rem -2rem; }
        }
        @media print {
          .no-print, header, nav, aside, button:not(.print-allow), 
          .ql-toolbar, .image-sidebar, .navigation-pane, .ai-assistant-container,
          .ribbon-container, .top-bar, [class*="Header"], [class*="Ribbon"], 
          [class*="AIAssistant"], [class*="StatusBar"] {
            display: none !important;
          }
          
          body, html, #root {
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
          }

          main {
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            background: transparent !important;
            overflow: visible !important;
            height: auto !important;
          }

          .ql-container.ql-snow {
            border: none !important;
            height: auto !important;
            overflow: visible !important;
          }

          .ql-editor {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            height: auto !important;
            background-color: transparent !important;
          }

          .page-break, hr {
            display: block !important;
            height: 0 !important;
            margin: 0 !important;
            border: none !important;
            page-break-after: always !important;
            break-after: page !important;
            visibility: hidden !important;
          }
        }
        table {
          margin-bottom: 1rem;
        }
        table td {
          padding: 8px;
          border: 1px solid #cbd5e1;
        }
      `}</style>
      <input 
        type="file" 
        ref={imageInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleImageFileChange} 
      />
      <div ref={editorRef} />
    </>
  );
});

Editor.displayName = 'Editor';
export default Editor;
