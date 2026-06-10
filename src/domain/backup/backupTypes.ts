export interface MarkdownBackupFile {
  filename: string;
  content: string;
}

export interface DualBackupPayload {
  dbBuffer: Uint8Array;
  mdFiles: MarkdownBackupFile[];
}
