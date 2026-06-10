export const sel = {
  blockTree: '[data-testid="block-tree"]',
  row: '[data-testid="outliner-row"]',
  rowById: (id: string) => `[data-block-id="${id}"]`,
  editor: '[data-testid="block-editor"] .ProseMirror',
  taskCheckbox: '[data-testid="task-checkbox"]',
  loading: "text=Loading database…",
} as const;
