function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function replaceWikiLinkInContent(
  content: string,
  oldName: string,
  newName: string,
): string {
  const regex = new RegExp(`\\[\\[${escapeRegExp(oldName)}\\]\\]`, "gi");
  return content.replace(regex, `[[${newName}]]`);
}
