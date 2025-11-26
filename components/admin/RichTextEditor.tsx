// components/admin/RichTextEditor.tsx
import React, { useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '',
  className = '',
  disabled = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertBold = () => {
    if (!textareaRef.current || disabled) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const boldText = `**${selectedText}**`;
    
    const newValue = value.substring(0, start) + boldText + value.substring(end);
    onChange(newValue);
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = start + boldText.length;
        textareaRef.current.selectionEnd = start + boldText.length;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const insertLink = () => {
    if (!textareaRef.current || disabled) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    // If text is selected, use it as the link text
    let linkText = selectedText || 'link text';
    const linkUrl = 'https://example.com';
    const linkMarkup = `[${linkText}](${linkUrl})`;
    
    const newValue = value.substring(0, start) + linkMarkup + value.substring(end);
    onChange(newValue);
    
    // Set cursor position to edit the URL
    setTimeout(() => {
      if (textareaRef.current) {
        const urlStart = start + linkText.length + 3; // Position after '[' + linkText + ']('
        const urlEnd = urlStart + linkUrl.length;
        textareaRef.current.selectionStart = urlStart;
        textareaRef.current.selectionEnd = urlEnd;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const insertCenter = () => {
    if (!textareaRef.current || disabled) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const centerText = `^^${selectedText}^^`;
    
    const newValue = value.substring(0, start) + centerText + value.substring(end);
    onChange(newValue);
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = start + centerText.length;
        textareaRef.current.selectionEnd = start + centerText.length;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center mb-2 space-x-2 p-2 bg-white bg-opacity-10 dark:bg-gray-800 dark:bg-opacity-20 rounded-t-lg">
        <button
          type="button"
          onClick={insertBold}
          disabled={disabled}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
          title="Bold (**text**)">
          <span className="font-bold">B</span>
        </button>
        <button
          type="button"
          onClick={insertLink}
          disabled={disabled}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
          title="Link [text](url)">
          Link
        </button>
        <button
          type="button"
          onClick={insertCenter}
          disabled={disabled}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
          title="Center (^^text^^)">
          Center
        </button>
      </div>
      
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full p-3 bg-white bg-opacity-5 dark:bg-gray-800 dark:bg-opacity-20 backdrop-filter backdrop-blur-sm
          border border-gray-700 dark:border-gray-500 rounded-b-lg
          text-darkText dark:text-lightText placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent
          transition-all duration-300 resize-y`}
        rows={15}
      />
    </div>
  );
};

export default RichTextEditor;