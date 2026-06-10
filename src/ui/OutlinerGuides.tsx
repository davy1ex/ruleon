import { INDENTATION_WIDTH_PX } from "../features/outliner/indentation";

interface OutlinerGuidesProps {
  depth: number;
}

export function OutlinerGuides({ depth }: OutlinerGuidesProps) {
  if (depth === 0) {
    return null;
  }

  return (
    <div className="flex shrink-0 self-stretch" aria-hidden>
      {Array.from({ length: depth }, (_, index) => (
        <div
          key={index}
          style={{ width: INDENTATION_WIDTH_PX }}
          className="border-l border-guide-line"
        />
      ))}
    </div>
  );
}
