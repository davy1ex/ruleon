import { useEffect, useState, type KeyboardEvent } from "react";

interface PageTitleInputProps {
  title: string;
  onRename: (newTitle: string) => void;
}

export function PageTitleInput({ title, onRename }: PageTitleInputProps) {
  const [draft, setDraft] = useState(title);

  useEffect(() => {
    setDraft(title);
  }, [title]);

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed === "" || trimmed === title) {
      setDraft(title);
      return;
    }
    onRename(trimmed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commitRename}
      onKeyDown={handleKeyDown}
      className="w-full border-0 bg-transparent p-0 text-2xl font-bold text-text-emphasis outline-none focus:ring-0"
      aria-label="Page title"
    />
  );
}
