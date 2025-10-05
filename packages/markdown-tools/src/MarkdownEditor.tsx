import type { ChangeEvent, CSSProperties, FC } from "react";

import { MarkdownPreview } from "./MarkdownPreview.js";

export interface MarkdownEditorProps {
  value: string;
  onChange: (nextValue: string) => void;
  readOnly?: boolean;
  minHeight?: number;
  editorLabel?: string;
  previewLabel?: string;
  placeholder?: string;
}

const containerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  gap: 24,
  alignItems: "stretch",
  width: "100%",
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  color: "#94a3b8",
  marginBottom: 8,
  display: "block",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(148, 163, 184, 0.35)",
  backgroundColor: "rgba(15, 23, 42, 0.65)",
  color: "#f8fafc",
  padding: 16,
  fontSize: 14,
  fontFamily:
    "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  lineHeight: 1.6,
  resize: "vertical",
  minHeight: 300,
  boxShadow: "inset 0 0 0 1px rgba(148, 163, 184, 0.05)",
};

const panelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

export const MarkdownEditor: FC<MarkdownEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  minHeight = 300,
  editorLabel = "Markdown",
  previewLabel = "Preview",
  placeholder = "Write markdown content",
}) => {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <div style={containerStyle}>
      <div style={panelStyle}>
        <label style={labelStyle}>{editorLabel}</label>
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          style={{ ...textareaStyle, minHeight }}
          readOnly={readOnly}
          spellCheck={false}
        />
      </div>
      <div style={panelStyle}>
        <label style={labelStyle}>{previewLabel}</label>
        <MarkdownPreview content={value} style={{ minHeight }} />
      </div>
    </div>
  );
};
