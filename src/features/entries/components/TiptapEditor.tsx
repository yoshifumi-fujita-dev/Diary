"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough } from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function TiptapEditor({
  content,
  onChange,
  placeholder = "今日のできごとを書いてみましょう...",
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Underline,
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

  if (!editor) return null;

  return (
    <div className="flex-1 flex flex-col border border-zinc-700 rounded-lg bg-zinc-900 focus-within:ring-2 focus-within:ring-zinc-500 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950 min-h-0">
      {/* ツールバー */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-700 shrink-0">
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
