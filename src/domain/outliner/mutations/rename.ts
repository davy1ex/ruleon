import type { RuleonDb as DB } from "../../db/types";
import { replaceWikiLinkInDoc } from "../../../features/editor/serialization/replaceWikiLinkInDoc";
import { parseStoredContent } from "../../../features/editor/serialization/parseStoredContent";
import { currentTimestamp } from "../seed";
import { updateContent } from "./update";

export async function renamePageGlobally(
  db: DB,
  pageId: string,
  oldName: string,
  newName: string,
): Promise<void> {
  const normalizedOldName = oldName.trim().toLowerCase();
  const trimmedNewName = newName.trim();

  if (trimmedNewName === "" || normalizedOldName === trimmedNewName.toLowerCase()) {
    return;
  }

  await db.exec("BEGIN");
  try {
    await db.exec(
      `UPDATE outline_nodes
       SET content = ?, updated_at = ?
       WHERE id = ?`,
      [trimmedNewName, currentTimestamp(), pageId],
    );

    const stmt = await db.prepare(
      `SELECT n.id, n.content
       FROM outline_nodes n
       JOIN block_links bl ON n.id = bl.source_block_id
       WHERE bl.target_text = ?`,
    );
    const rows = (await stmt.all(null, normalizedOldName)) as {
      id: string;
      content: string;
    }[];
    await stmt.finalize(null);

    for (const row of rows) {
      const parsed = parseStoredContent(row.content);
      const updatedContent = replaceWikiLinkInDoc(parsed, oldName, trimmedNewName);
      await updateContent(db, row.id, updatedContent, { inTransaction: true });
    }

    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}
