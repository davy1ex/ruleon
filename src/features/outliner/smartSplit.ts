export function isInsideWikiLink(content: string, position: number): boolean {
  const before = content.slice(0, position);
  const lastOpen = before.lastIndexOf("[[");
  if (lastOpen === -1) {
    return false;
  }
  return before.lastIndexOf("]]") < lastOpen;
}

export function repairWikiLinkSplit(
  leftPart: string,
  rightPart: string,
): { leftPart: string; rightPart: string } {
  const lastOpenLeft = leftPart.lastIndexOf("[[");
  const lastCloseLeft = leftPart.lastIndexOf("]]");

  if (lastOpenLeft <= lastCloseLeft) {
    return { leftPart, rightPart };
  }

  const closeOnRight = rightPart.indexOf("]]");
  if (closeOnRight === -1) {
    return { leftPart: `${leftPart}]]`, rightPart };
  }

  const linkTail = rightPart.slice(0, closeOnRight);
  const afterLink = rightPart.slice(closeOnRight + 2);

  return {
    leftPart: `${leftPart}${linkTail}]]`,
    rightPart: afterLink,
  };
}

export function sliceTextForSplit(
  fullText: string,
  splitIndex: number,
): { leftPart: string; rightPart: string } | null {
  let leftPart = fullText.slice(0, splitIndex);
  let rightPart = fullText.slice(splitIndex);

  ({ leftPart, rightPart } = repairWikiLinkSplit(leftPart, rightPart));

  leftPart = leftPart.trim();
  rightPart = rightPart.trim();

  if (leftPart.length === 0 && rightPart.length === 0) {
    return null;
  }

  return { leftPart, rightPart };
}
