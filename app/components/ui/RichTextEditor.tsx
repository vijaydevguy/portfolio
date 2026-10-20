"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiCode,
  FiLink,
  FiRotateCcw,
  FiRotateCw,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiMinus,
} from "react-icons/fi";
import { MdFormatListNumbered, MdFormatStrikethrough, MdFormatQuote, MdFormatClear } from "react-icons/md";

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
}

export default function RichTextEditor({
  label,
  value,
  onChange,
  placeholder = "Write points, architectural description, bullet highlights, code notes...",
  helperText,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });

  // Sync value into contentEditable without breaking cursor position on active user typing
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const updateActiveStates = () => {
    if (typeof document === "undefined") return;
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
      });
    } catch {
      // Ignored if selection not in editable element
    }
  };

  const executeCommand = (cmd: string, val: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveStates();
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    updateActiveStates();
  };

  const handleInsertLink = () => {
    const url = prompt("Enter hyperlink URL (e.g. https://...):");
    if (url && url.trim()) {
      executeCommand("createLink", url.trim());
    }
  };

  const handleBlockFormat = (tag: string) => {
    executeCommand("formatBlock", `<${tag}>`);
  };

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <label className="form-label font-semibold text-zinc-900 !mb-0">{label}</label>
        {helperText && <span className="text-[11px] text-slate-400">{helperText}</span>}
      </div>

      <div className="rounded-2xl border border-zinc-200 overflow-hidden bg-white shadow-2xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        {/* Full Rich Text Toolbar */}
        <div
          className="flex flex-wrap items-center gap-1 p-2 bg-zinc-50 border-b border-zinc-200 select-none"
          onMouseDown={(e) => {
            // Prevent blur of editor when clicking buttons
            if ((e.target as HTMLElement).tagName !== "SELECT") {
              e.preventDefault();
            }
          }}
        >
          {/* Paragraph / Heading Selector */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleBlockFormat(e.target.value);
                e.target.value = "";
              }
            }}
            defaultValue=""
            className="text-xs bg-white border border-zinc-200 rounded-lg px-2 py-1 text-zinc-700 hover:border-zinc-300 focus:outline-none cursor-pointer"
            title="Heading format"
          >
            <option value="" disabled>
              Heading / Style
            </option>
            <option value="p">Normal text (Paragraph)</option>
            <option value="h2">Heading 2 (Large)</option>
            <option value="h3">Heading 3 (Medium)</option>
            <option value="h4">Heading 4 (Small)</option>
            <option value="blockquote">Quote Block</option>
            <option value="pre">Code Block</option>
          </select>

          <div className="w-[1px] h-4 bg-zinc-300 mx-0.5" />

          {/* Bold */}
          <button
            type="button"
            onClick={() => executeCommand("bold")}
            className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeFormats.bold ? "bg-blue-100 text-[#1D4ED8]" : "hover:bg-zinc-200 text-zinc-700"
            }`}
            title="Bold (Ctrl+B)"
          >
            <FiBold className="w-3.5 h-3.5" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => executeCommand("italic")}
            className={`p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
              activeFormats.italic ? "bg-blue-100 text-[#1D4ED8]" : "hover:bg-zinc-200 text-zinc-700"
            }`}
            title="Italic (Ctrl+I)"
          >
            <FiItalic className="w-3.5 h-3.5" />
          </button>

          {/* Underline */}
          <button
            type="button"
            onClick={() => executeCommand("underline")}
            className={`p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
              activeFormats.underline ? "bg-blue-100 text-[#1D4ED8]" : "hover:bg-zinc-200 text-zinc-700"
            }`}
            title="Underline (Ctrl+U)"
          >
            <FiUnderline className="w-3.5 h-3.5" />
          </button>

          {/* Strikethrough */}
          <button
            type="button"
            onClick={() => executeCommand("strikeThrough")}
            className={`p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
              activeFormats.strikeThrough ? "bg-blue-100 text-[#1D4ED8]" : "hover:bg-zinc-200 text-zinc-700"
            }`}
            title="Strikethrough"
          >
            <MdFormatStrikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-zinc-300 mx-0.5" />

          {/* Bullet List */}
          <button
            type="button"
            onClick={() => executeCommand("insertUnorderedList")}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors ${
              activeFormats.insertUnorderedList ? "bg-blue-100 text-[#1D4ED8]" : "hover:bg-zinc-200 text-zinc-700"
            }`}
            title="Bullet List"
          >
            <FiList className="w-3.5 h-3.5" />
          </button>

          {/* Numbered List */}
          <button
            type="button"
            onClick={() => executeCommand("insertOrderedList")}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors ${
              activeFormats.insertOrderedList ? "bg-blue-100 text-[#1D4ED8]" : "hover:bg-zinc-200 text-zinc-700"
            }`}
            title="Numbered List"
          >
            <MdFormatListNumbered className="w-3.5 h-3.5" />
          </button>

          {/* Quote */}
          <button
            type="button"
            onClick={() => handleBlockFormat("blockquote")}
            className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-700 text-xs cursor-pointer"
            title="Quote Block"
          >
            <MdFormatQuote className="w-3.5 h-3.5" />
          </button>

          {/* Code inline / pre */}
          <button
            type="button"
            onClick={() => handleBlockFormat("pre")}
            className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-700 text-xs cursor-pointer"
            title="Code Block"
          >
            <FiCode className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-zinc-300 mx-0.5" />

          {/* Text Alignment */}
          <button
            type="button"
            onClick={() => executeCommand("justifyLeft")}
            className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-700 text-xs cursor-pointer"
            title="Align Left"
          >
            <FiAlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("justifyCenter")}
            className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-700 text-xs cursor-pointer"
            title="Align Center"
          >
            <FiAlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand("justifyRight")}
            className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-700 text-xs cursor-pointer"
            title="Align Right"
          >
            <FiAlignRight className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-zinc-300 mx-0.5" />

          {/* Horizontal Line / Divider */}
          <button
            type="button"
            onClick={() => executeCommand("insertHorizontalRule")}
            className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-700 text-xs cursor-pointer"
            title="Insert Horizontal Divider"
          >
            <FiMinus className="w-3.5 h-3.5" />
          </button>

          {/* Link */}
          <button
            type="button"
            onClick={handleInsertLink}
            className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-700 text-xs cursor-pointer"
            title="Insert Link"
          >
            <FiLink className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-zinc-300 mx-0.5" />

          {/* Undo */}
          <button
            type="button"
            onClick={() => executeCommand("undo")}
            className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-600 text-xs cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <FiRotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={() => executeCommand("redo")}
            className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-600 text-xs cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <FiRotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Clear Formatting */}
          <button
            type="button"
            onClick={() => executeCommand("removeFormat")}
            className="p-1.5 rounded-lg hover:bg-zinc-200 text-slate-500 hover:text-zinc-900 text-xs cursor-pointer"
            title="Clear formatting"
          >
            <MdFormatClear className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Editable Area */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyUp={updateActiveStates}
          onMouseUp={updateActiveStates}
          data-placeholder={placeholder}
          className="p-4 min-h-[200px] max-h-[420px] overflow-y-auto focus:outline-none text-zinc-800 text-xs sm:text-sm leading-relaxed prose prose-sm max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:my-2 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:my-2 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:my-2 [&>h3]:text-base [&>h3]:font-bold [&>h3]:my-2 [&>h4]:text-sm [&>h4]:font-bold [&>h4]:my-1.5 [&>blockquote]:border-l-4 [&>blockquote]:border-blue-500 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:my-2 [&>blockquote]:text-slate-600 [&>pre]:bg-zinc-900 [&>pre]:text-zinc-100 [&>pre]:p-3 [&>pre]:rounded-xl [&>pre]:my-2 [&>pre]:font-mono [&>pre]:text-xs [&>hr]:my-4 [&>hr]:border-zinc-200 [&>a]:text-blue-600 [&>a]:underline"
        />
      </div>
    </div>
  );
}
