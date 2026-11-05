'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import ImageExt from '@tiptap/extension-image';
import { Bold, Heading2, Heading3, ImageIcon, Italic, Link2, List, ListOrdered, Quote, Redo, Undo } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MediaPicker } from './MediaPicker';

export function RichTextEditor({ value, onChange, id }: { value: string; onChange: (html: string) => void; id?: string }) {
  const [picking, setPicking] = useState(false);
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: false }), Link.configure({ openOnClick: false }), ImageExt],
    content: value || '',
    immediatelyRender: false,
    editorProps: {
      attributes: { id: id ?? '', class: 'prose-iacec min-h-[160px] px-4 py-3 outline-none' },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return <div className="h-[200px] rounded-lg border border-navy/15 bg-mist/50" />;

  const tool = (active: boolean, onClick: () => void, label: string, Icon: typeof Bold) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn('rounded p-1.5 text-ink/70 hover:bg-white hover:text-navy', active && 'bg-white text-navy shadow-sm')}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-navy/15 bg-white focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20">
      <div className="flex flex-wrap gap-0.5 border-b border-navy/10 bg-mist px-2 py-1">
        {tool(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Bold', Bold)}
        {tool(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italic', Italic)}
        {tool(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Heading', Heading2)}
        {tool(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'Subheading', Heading3)}
        {tool(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Bulleted list', List)}
        {tool(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Numbered list', ListOrdered)}
        {tool(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), 'Quote', Quote)}
        {tool(
          editor.isActive('link'),
          () => {
            const prev = editor.getAttributes('link').href as string | undefined;
            const href = window.prompt('Link address (leave empty to remove)', prev ?? 'https://');
            if (href === null) return;
            if (!href) editor.chain().focus().unsetLink().run();
            else editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
          },
          'Link',
          Link2,
        )}
        {tool(false, () => setPicking(true), 'Insert image', ImageIcon)}
        <span className="mx-1 w-px bg-navy/10" />
        {tool(false, () => editor.chain().focus().undo().run(), 'Undo', Undo)}
        {tool(false, () => editor.chain().focus().redo().run(), 'Redo', Redo)}
      </div>
      <EditorContent editor={editor} />
      <MediaPicker
        open={picking}
        onClose={() => setPicking(false)}
        onSelect={(m) => {
          editor.chain().focus().setImage({ src: m.url, alt: m.alt }).run();
          setPicking(false);
        }}
      />
    </div>
  );
}
