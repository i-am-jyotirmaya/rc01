import type { CSSProperties, FC, HTMLAttributes, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

export interface MarkdownPreviewProps {
  content: string;
  className?: string;
  style?: CSSProperties;
  emptyState?: string;
}

const containerStyle: CSSProperties = {
  background: "linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.92))",
  borderRadius: 12,
  padding: 16,
  color: "#e2e8f0",
  fontSize: 14,
  lineHeight: 1.65,
  overflowWrap: "anywhere",
  boxShadow: "0 18px 35px rgba(15, 23, 42, 0.45)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  overflowY: "auto",
};

const headingColor = "#f8fafc";

const headingStyle = (level: number): CSSProperties => ({
  fontSize: [28, 22, 20, 18, 16, 14][level - 1] ?? 16,
  marginTop: level === 1 ? 0 : 24,
  marginBottom: 12,
  color: headingColor,
  fontWeight: 700,
});

const paragraphStyle: CSSProperties = {
  margin: "0 0 14px",
};

const listStyle: CSSProperties = {
  paddingLeft: 20,
  marginBottom: 14,
};

const inlineCodeStyle: CSSProperties = {
  fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  backgroundColor: "rgba(99, 102, 241, 0.2)",
  borderRadius: 6,
  padding: "2px 6px",
  color: "#f8fafc",
};

const codeBlockWrapperStyle: CSSProperties = {
  backgroundColor: "rgba(15, 118, 110, 0.16)",
  borderRadius: 10,
  padding: 16,
  marginBottom: 16,
  overflowX: "auto",
  border: "1px solid rgba(94, 234, 212, 0.25)",
};

const codeBlockStyle: CSSProperties = {
  ...inlineCodeStyle,
  display: "block",
  padding: 0,
  backgroundColor: "transparent",
  color: "#e0f2fe",
  fontSize: 13,
  whiteSpace: "pre",
};

const blockquoteStyle: CSSProperties = {
  borderLeft: "4px solid rgba(148, 163, 184, 0.5)",
  paddingLeft: 16,
  margin: "0 0 16px",
  color: "#cbd5f5",
  backgroundColor: "rgba(148, 163, 184, 0.12)",
  borderRadius: 8,
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: 16,
};

const tableCellStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.3)",
  padding: "8px 12px",
};

type CodeProps = { inline?: boolean; children?: ReactNode } & HTMLAttributes<HTMLElement>;

const markdownComponents: Components = {
  h1: (props) => <h1 style={headingStyle(1)} {...props} />,
  h2: (props) => <h2 style={headingStyle(2)} {...props} />,
  h3: (props) => <h3 style={headingStyle(3)} {...props} />,
  h4: (props) => <h4 style={headingStyle(4)} {...props} />,
  h5: (props) => <h5 style={headingStyle(5)} {...props} />,
  h6: (props) => <h6 style={headingStyle(6)} {...props} />,
  p: (props) => <p style={paragraphStyle} {...props} />,
  ul: (props) => <ul style={listStyle} {...props} />,
  ol: (props) => <ol style={listStyle} {...props} />,
  li: (props) => <li style={{ marginBottom: 6 }} {...props} />,
  blockquote: (props) => <blockquote style={blockquoteStyle} {...props} />,
  table: (props) => <table style={tableStyle} {...props} />,
  th: (props) => (
    <th
      style={{
        ...tableCellStyle,
        textAlign: "left",
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        color: headingColor,
      }}
      {...props}
    />
  ),
  td: (props) => <td style={tableCellStyle} {...props} />,
  code: ({ inline, children, ...props }: CodeProps) =>
    inline ? (
      <code style={inlineCodeStyle} {...props}>
        {children}
      </code>
    ) : (
      <pre style={codeBlockWrapperStyle}>
        <code style={codeBlockStyle} {...props}>
          {children}
        </code>
      </pre>
    ),
};

export const MarkdownPreview: FC<MarkdownPreviewProps> = ({
  content,
  className,
  style,
  emptyState = "Nothing to preview yet.",
}) => {
  const trimmed = content.trim();

  if (!trimmed) {
    return (
      <div
        className={className}
        style={{
          ...containerStyle,
          ...style,
          fontStyle: "italic",
          color: "#94a3b8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 120,
        }}
      >
        {emptyState}
      </div>
    );
  }

  return (
    <div className={className} style={{ ...containerStyle, ...style }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {trimmed}
      </ReactMarkdown>
    </div>
  );
};
