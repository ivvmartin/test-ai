import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

type Props = {
  content: string;
  className?: string;
};

/**
 * Renders markdown content with proper styling
 */
export const MarkdownContent = memo(({ content, className }: Props) => {
  const cleanedContent = useMemo(
    () =>
      content
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]+$/gm, "")
        .trim(),
    [content]
  );

  const combinedClassName = cn(
    "prose prose-sm max-w-none dark:prose-invert",
    // Headings
    "prose-headings:font-semibold prose-headings:text-foreground",
    // Paragraphs
    "prose-p:text-foreground prose-p:leading-relaxed prose-p:my-3",
    // Lists
    "prose-ul:text-foreground prose-ol:text-foreground prose-ul:my-3 prose-ol:my-3",
    "prose-li:text-foreground prose-li:marker:text-muted-foreground prose-li:my-1",
    // Code
    "prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none",
    "prose-pre:bg-muted prose-pre:text-foreground prose-pre:border prose-pre:border-border",
    // Blockquotes
    "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground",
    // Tables
    "prose-table:text-foreground",
    "prose-thead:border-b prose-thead:border-border",
    "prose-tr:border-b prose-tr:border-border",
    "prose-th:text-foreground prose-th:font-semibold",
    "prose-td:text-foreground",
    // Emphasis/Italic
    "prose-em:text-foreground",
    className
  );

  return (
    <div className={combinedClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          hr: ({ node, ...props }) => (
            <hr {...props} className="my-6 border-border" />
          ),
          strong: ({ node, ...props }) => (
            <strong {...props} className="font-semibold text-foreground" />
          ),
        }}
      >
        {cleanedContent}
      </ReactMarkdown>
    </div>
  );
});

MarkdownContent.displayName = "MarkdownContent";
