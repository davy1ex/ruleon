// Строгий Regex: только буквы, цифры, дефис и подчеркивание. Никаких пробелов.
const INLINE_REGEX = /(\*\*.*?\*\*|\*.*?\*|`.*?`|#[a-zA-Z0-9_а-яА-Я-]+)/g;

const parseInlineTokens = (text: string) => {
  const parts = text.split(INLINE_REGEX);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-text-normal">
          {part.slice(2, -2)}
        </strong>
      );
    }
    // Italic
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="italic text-text-normal">
          {part.slice(1, -1)}
        </em>
      );
    }
    // Code
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="mx-1 rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-sm text-accent"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    // Tags (Обязательная проверка на отсутствие пробелов внутри)
    if (part.startsWith("#") && !part.includes(" ")) {
      return (
        <span
          key={index}
          className="mx-0.5 inline-block cursor-pointer rounded-md bg-accent/15 px-1.5 py-0.5 text-xs font-bold text-accent transition-colors hover:bg-accent/30"
        >
          {part}
        </span>
      );
    }

    // Plain text
    return <span key={index}>{part}</span>;
  });
};

export function RichTextInline({ content }: { content: string }) {
  return <>{parseInlineTokens(content)}</>;
}

export const RichText = ({
  content,
  isDone,
  isFailed,
}: {
  content: string;
  isDone?: boolean;
  isFailed?: boolean;
}) => {
  const h3Match = content.match(/^###\s+(.*)/);
  const h2Match = content.match(/^##\s+(.*)/);
  const h1Match = content.match(/^#\s+(.*)/);

  const baseOpacity = isFailed
    ? "text-red-400 line-through opacity-70"
    : isDone
      ? "opacity-40 line-through"
      : "";

  if (h3Match) {
    return (
      <h3
        className={`text-lg font-bold mt-2 mb-1 text-text-normal ${baseOpacity}`}
      >
        {parseInlineTokens(h3Match[1])}
      </h3>
    );
  }
  if (h2Match) {
    return (
      <h2
        className={`text-xl font-bold mt-3 mb-1.5 text-text-normal ${baseOpacity}`}
      >
        {parseInlineTokens(h2Match[1])}
      </h2>
    );
  }
  if (h1Match) {
    return (
      <h1
        className={`text-2xl font-bold mt-4 mb-2 text-text-normal ${baseOpacity}`}
      >
        {parseInlineTokens(h1Match[1])}
      </h1>
    );
  }

  return (
    <div
      className={`editor-text min-h-editor-row whitespace-pre-wrap break-words font-ui text-editor text-text-normal ${baseOpacity}`}
    >
      {parseInlineTokens(content)}
    </div>
  );
};
