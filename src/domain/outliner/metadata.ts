import { extractPlainText } from "../../features/editor/serialization/extractPlainText";
import type { BlockContentJSON } from "./contentTypes";
import type { TaskStatus } from "./types";

export interface NodeMetadata {
  tags: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
  awarded_xp?: number;
}

export function emptyNodeMetadata(): NodeMetadata {
  return { tags: [], created_at: "", updated_at: "" };
}

export const extractTags = (text: string): string[] => {
  const matches = text.match(/#[\wа-яА-Я-]+/g);
  return matches ? matches.map((tag) => tag.slice(1).toLowerCase()) : [];
};

export function tagsFromContent(content: BlockContentJSON): string[] {
  return extractTags(extractPlainText(content));
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function parseMetadata(raw: string | null | undefined): NodeMetadata {
  if (!raw || raw.trim() === "") {
    return { tags: [], created_at: "", updated_at: "" };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { tags: [], created_at: "", updated_at: "" };
    }

    const record = parsed as Record<string, unknown>;
    return {
      tags: Array.isArray(record.tags)
        ? record.tags.filter((tag): tag is string => typeof tag === "string")
        : [],
      created_at: readOptionalString(record.created_at) ?? "",
      updated_at: readOptionalString(record.updated_at) ?? "",
      ...(readOptionalString(record.completed_at)
        ? { completed_at: readOptionalString(record.completed_at) }
        : {}),
      ...(readOptionalNumber(record.awarded_xp) !== undefined
        ? { awarded_xp: readOptionalNumber(record.awarded_xp) }
        : {}),
    };
  } catch {
    return { tags: [], created_at: "", updated_at: "" };
  }
}

export function normalizeMetadata(
  metadata: NodeMetadata,
  now = new Date().toISOString(),
): NodeMetadata {
  const createdAt = metadata.created_at || now;
  return {
    tags: metadata.tags ?? [],
    created_at: createdAt,
    updated_at: metadata.updated_at || createdAt,
    ...(metadata.completed_at ? { completed_at: metadata.completed_at } : {}),
    ...(metadata.awarded_xp !== undefined
      ? { awarded_xp: metadata.awarded_xp }
      : {}),
  };
}

export function serializeMetadata(metadata: NodeMetadata): string {
  return JSON.stringify(metadata);
}

export function initialNodeMetadata(
  now = new Date().toISOString(),
): NodeMetadata {
  return {
    tags: [],
    created_at: now,
    updated_at: now,
  };
}

export function applyContentMetadata(
  current: NodeMetadata,
  tags: string[],
): NodeMetadata {
  return {
    ...normalizeMetadata(current),
    tags,
    updated_at: new Date().toISOString(),
  };
}

/** @deprecated Use applyContentMetadata */
export function withTagsMetadata(
  current: NodeMetadata,
  tags: string[],
): NodeMetadata {
  return applyContentMetadata(current, tags);
}

export function applyTaskLifecycleMetadata(
  current: NodeMetadata,
  nextStatus: TaskStatus | null,
): NodeMetadata {
  const next: NodeMetadata = {
    ...normalizeMetadata(current),
    updated_at: new Date().toISOString(),
  };

  if (nextStatus === "DONE") {
    next.completed_at = new Date().toISOString();
  } else {
    delete next.completed_at;
  }

  return next;
}
