import type { KeyboardEvent, MouseEvent } from "react";

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onMouseDown?: (event: MouseEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  placeholder?: string;
}

export function Input({
  value,
  onChange,
  onFocus,
  onMouseDown,
  onKeyDown,
  autoFocus = false,
  placeholder,
}: InputProps) {
  return (
    <input
      type="text"
      value={value}
      autoFocus={autoFocus}
      placeholder={placeholder}
      onFocus={onFocus}
      onMouseDown={onMouseDown}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      className="w-full bg-transparent py-0.5 font-mono text-sm outline-none"
    />
  );
}
