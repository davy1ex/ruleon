import { useEditor, type Editor } from "@tiptap/react";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import type { BlockContentJSON } from "../domain/outliner/contentTypes";
import { createBlockExtensions } from "../features/editor/createBlockExtensions";
import { applyPortalNormalization } from "../features/editor/document/applyPortalNormalization";
import { normalizePortalSyntaxInDoc } from "../features/editor/serialization/normalizePortalSyntax";
import { serializeForDb } from "../features/editor/serialization/serializeForDb";
import { useOutlinerStore } from "../store/outlinerStore";
import { useBlockEditorNavigation } from "./useBlockEditorNavigation";
import { useBlockRowFocus } from "./useBlockRowFocus";
import { QueryPortalView } from "./QueryPortalView";

interface UseBlockRowEditorOptions {
  nodeId: string;
  nodeContent: BlockContentJSON;
  hasChildren: boolean;
  readOnly?: boolean;
  isFocused: boolean;
  onToggleSelect: (id: string) => void;
}

export function useBlockRowEditor({
  nodeId,
  nodeContent,
  hasChildren,
  readOnly = false,
  isFocused,
  onToggleSelect,
}: UseBlockRowEditorOptions) {
  const [localDoc, setLocalDoc] = useState<BlockContentJSON>(() =>
    normalizePortalSyntaxInDoc(nodeContent),
  );
  const [inputFocused, setInputFocused] = useState(isFocused);
  const editorRef = useRef<Editor | null>(null);

  const pruneEmptyBlock = useOutlinerStore((state) => state.pruneEmptyBlock);
  const splitBlock = useOutlinerStore((state) => state.splitBlock);
  const mergeBlockWithPrevious = useOutlinerStore(
    (state) => state.mergeBlockWithPrevious,
  );
  const debouncedUpdateContent = useOutlinerStore(
    (state) => state.debouncedUpdateContent,
  );
  const flushUpdateContent = useOutlinerStore((state) => state.flushUpdateContent);
  const indent = useOutlinerStore((state) => state.indent);
  const outdent = useOutlinerStore((state) => state.outdent);
  const navigateToPage = useOutlinerStore((state) => state.navigateToPage);
  const toggleTaskStatus = useOutlinerStore((state) => state.toggleTaskStatus);
  const nodeStillExists = useOutlinerStore((state) =>
    Object.values(state.nodesByRootId).some((nodes) =>
      nodes.some((node) => node.id === nodeId),
    ),
  );

  const editor = useEditor(
    {
      extensions: createBlockExtensions({
        readOnly,
        QueryPortalView,
        onSplitBlock: async ({ left, right }) => {
          await flushUpdateContent(nodeId, localDoc);
          await splitBlock(nodeId, left, right);
        },
        onIndent: async () => {
          await flushUpdateContent(nodeId, localDoc);
          await indent(nodeId);
        },
        onOutdent: async () => {
          await flushUpdateContent(nodeId, localDoc);
          await outdent(nodeId);
        },
        onMergeWithPrevious: async ({ remainder }) => {
          await flushUpdateContent(nodeId, localDoc);
          await mergeBlockWithPrevious(nodeId, remainder);
        },
        onToggleTaskStatus: () => toggleTaskStatus(nodeId),
        onNavigateWikiLink: (pageName) => {
          void navigateToPage(pageName);
        },
      }),
      content: normalizePortalSyntaxInDoc(localDoc) ?? undefined,
      editable: !readOnly,
      editorProps: {
        attributes: {
          class: "outline-none",
        },
        handleDOMEvents: {
          input: () => {
            queueMicrotask(() => {
              const active = editorRef.current;
              if (active) {
                applyPortalNormalization(active);
              }
            });
            return false;
          },
        },
        handleClick: (view, pos) => {
          const node = view.state.doc.nodeAt(pos);
          if (node?.type.name === "wikiLink") {
            const pageName = node.attrs.pageName as string | undefined;
            if (pageName) {
              void navigateToPage(pageName);
              return true;
            }
          }
          return false;
        },
      },
      onUpdate: ({ editor: activeEditor }) => {
        applyPortalNormalization(activeEditor);
        const nextDoc = activeEditor.getJSON() as BlockContentJSON;
        setLocalDoc(nextDoc);
        debouncedUpdateContent(nodeId, nextDoc);
      },
      onFocus: () => setInputFocused(true),
      onBlur: () => setInputFocused(false),
    },
    [nodeId, readOnly],
  );

  editorRef.current = editor;

  const navigation = useBlockEditorNavigation({
    nodeId,
    editor,
    hasChildren,
    readOnly,
    onToggleSelect,
    setInputFocused,
  });

  useBlockRowFocus({
    nodeId,
    isFocused,
    editorRef,
  });

  useEffect(() => {
    const restore = useOutlinerStore.getState().pendingCursorRestore;
    if (restore?.nodeId === nodeId) {
      setLocalDoc(nodeContent);
    }
  }, [nodeContent, nodeId]);

  useEffect(() => {
    setLocalDoc(normalizePortalSyntaxInDoc(nodeContent));
    // Reset local editor state when switching blocks; nodeContent is intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId]);

  useEffect(() => {
    const normalized = normalizePortalSyntaxInDoc(nodeContent);
    if (serializeForDb(normalized) === serializeForDb(nodeContent)) {
      return;
    }
    debouncedUpdateContent(nodeId, normalized);
  }, [nodeContent, nodeId, debouncedUpdateContent]);

  useEffect(() => {
    if (!inputFocused && editor && !editor.isFocused) {
      const normalized = normalizePortalSyntaxInDoc(nodeContent);
      setLocalDoc(normalized);
      editor.commands.setContent(normalized ?? { type: "doc", content: [] });
    }
  }, [nodeContent, inputFocused, editor]);

  useEffect(() => {
    setInputFocused(isFocused);
  }, [isFocused, nodeId]);

  useEffect(() => {
    if (!editor || !isFocused) {
      return;
    }

    if (applyPortalNormalization(editor)) {
      const nextDoc = editor.getJSON() as BlockContentJSON;
      setLocalDoc(nextDoc);
      debouncedUpdateContent(nodeId, nextDoc);
    }
  }, [editor, isFocused, nodeId, debouncedUpdateContent]);

  useEffect(() => {
    if (!nodeStillExists) {
      setInputFocused(false);
      editor?.commands.blur();
    }
  }, [nodeStillExists, editor]);

  const handleBlur = () => {
    if (!editor) {
      return;
    }

    applyPortalNormalization(editor);
    const nextDoc = editor.getJSON() as BlockContentJSON;
    setLocalDoc(nextDoc);
    void (async () => {
      await flushUpdateContent(nodeId, nextDoc);
      await pruneEmptyBlock(nodeId, nextDoc);
    })();
  };

  const handleContainerMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (navigation.handleModifierMouseDown(event)) {
      return;
    }
    editor?.commands.focus();
  };

  return {
    localDoc,
    inputFocused,
    editor,
    setInputFocused,
    handleBlur,
    handleContainerMouseDown,
    handleEditorKeyDown: navigation.handleEditorKeyDown,
    handleModifierMouseDown: navigation.handleModifierMouseDown,
    navigateToPage,
  };
}
