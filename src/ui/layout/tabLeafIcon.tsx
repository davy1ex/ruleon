import {
  Calendar,
  FileText,
  Search,
  Settings,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { WorkspaceLeafType } from "../../store/workspaceStore";

const LEAF_ICONS: Record<WorkspaceLeafType, LucideIcon> = {
  editor: FileText,
  journal: Calendar,
  trash: Trash2,
  search: Search,
  settings: Settings,
};

export function TabLeafIcon({
  type,
  size = 16,
}: {
  type: WorkspaceLeafType;
  size?: number;
}) {
  const Icon = LEAF_ICONS[type];
  return <Icon size={size} aria-hidden />;
}
