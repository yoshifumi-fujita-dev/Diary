"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import { useEffect, useState, useRef } from "react";
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, ChevronDown } from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const FONTS = [
  { label: "明朝体", value: "var(--font-shippori)" },
  { label: "ゴシック体", value: "var(--font-noto-sans)" },
  { label: "手書き風", value: "var(--font-klee)" },
];

export default function TiptapEditor({
  content,
  onChange,
  placeholder = "今日のできごとを書いてみましょう...",
}: TiptapEditorProps) {
  const [fontOpen, setFontOpen] = useState(false);
  const [currentFont, setCurrentFont] = useState(FONTS[0]);
  const fontRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Underline,
      TextStyle,
      FontFamily,
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert prose-zinc max-w-none min-h-[200px] h-full focus:outline-none px-1 leading-snug prose-p:my-1",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.commands.focus("end");
    }
  }, [editor]);

  useEffect(() => {
    if (!fontOpen) return;
    function handleClick(e: MouseEvent) {
      if (fontRef.current && !fontRef.current.contains(e.target as Node)) {
        setFontOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [fontOpen]);

  function applyFont(font: typeof FONTS[0]) {
    setCurrentFont(font);
    setFontOpen(false);
    editor?.chain().focus().selectAll().setFontFamily(font.value).run();
  }

  if (!editor) return null;

  return (
    <div className="flex-1 flex flex-col border border-zinc-700 rounded-lg bg-zinc-900 focus-within:ring-2 focus-within:ring-zinc-500 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950 min-h-0">
      {/* ツールバー */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-700 shrink-0">
        {/* フォント選択 */}
        <div ref={fontRef} className="relative">
          <button
            type="button"
            onClick={() => setFontOpen((v) => !v)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            <span style={{ fontFamily: currentFont.value }}>{currentFont.label}</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>
          {fontOpen && (
            <div className="absolute top-full left-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20 py-1 min-w-28">
              {FONTS.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => applyFont(font)}
                  className={`block w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors ${
                    currentFont.value === font.value ? "text-zinc-100" : "text-zinc-400"
                  }`}
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-zinc-700 mx-1" />

        {/* 装飾ボタン */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive("bold") ? "bg-zinc-600 text-zinc-100" : "text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"}`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive("italic") ? "bg-zinc-600 text-zinc-100" : "text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"}`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive("underline") ? "bg-zinc-600 text-zinc-100" : "text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"}`}
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded transition-colors ${editor.isActive("strike") ? "bg-zinc-600 text-zinc-100" : "text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"}`}
        >
          <Strikethrough className="w-4 h-4" />
        </button>
      </div>

      {/* エディタ本体 */}
      <EditorContent editor={editor} className="flex-1 overflow-y-auto p-4" />
    </div>
  );
}
