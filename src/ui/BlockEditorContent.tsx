import { EditorContent, type Editor } from "@tiptap/react";

interface BlockEditorContentProps {
  editor: Editor | null;
}

export function BlockEditorContent({ editor }: BlockEditorContentProps) {
  if (!editor) {
    return null;
  }

  return (
    <EditorContent
      editor={editor}
      className="block-editor min-h-[28px] w-full text-[15px] leading-7 text-text-emphasis [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-text-muted [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
    />
  );
}
