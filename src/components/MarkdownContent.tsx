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
    "prose max-w-none dark:prose-invert text-[0.9rem]",
    // Headings
    "prose-headings:font-semibold prose-headings:text-foreground prose-headings:mt-6 prose-headings:mb-3 first:prose-headings:mt-0",
    "prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
    // Paragraphs
    "prose-p:text-foreground prose-p:leading-relaxed prose-p:my-3 prose-p:whitespace-pre-wrap first:prose-p:mt-0 last:prose-p:mb-0",
    // Lists
    "prose-ul:text-foreground prose-ol:text-foreground prose-ul:my-3 prose-ol:my-3 prose-ul:space-y-2 prose-ol:space-y-2 prose-ul:pl-5 prose-ol:pl-5",
    "prose-li:text-foreground prose-li:marker:text-foreground prose-li:marker:font-bold prose-li:my-1.5 prose-li:leading-relaxed prose-li:pl-1.5",
    // Code
    "prose-code:text-foreground prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.85rem] prose-code:before:content-none prose-code:after:content-none",
    "prose-pre:bg-muted prose-pre:text-foreground prose-pre:border prose-pre:border-border prose-pre:my-4 prose-pre:p-4",
    // Blockquotes
    "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:my-4 prose-blockquote:pl-4",
    // Tables
    "prose-table:text-foreground prose-table:my-4",
    "prose-thead:border-b prose-thead:border-border",
    "prose-tr:border-b prose-tr:border-border",
    "prose-th:text-foreground prose-th:font-semibold prose-th:p-2",
    "prose-td:text-foreground prose-td:p-2",
    // Strong/Bold
    "prose-strong:text-foreground prose-strong:font-semibold",
    // Emphasis/Italic
    "prose-em:text-foreground",
    // Links
    "prose-a:text-primary prose-a:underline prose-a:decoration-primary/30 hover:prose-a:decoration-primary",
    // Horizontal rules
    "prose-hr:border-border prose-hr:my-6",
    className
  );

  return (
    <div className={combinedClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ node, ...props }) => (
            <p
              {...props}
              className="my-3 leading-relaxed first:mt-0 last:mb-0"
            />
          ),
          ul: ({ node, ...props }) => (
            <ul {...props} className="my-3 space-y-2 pl-5 list-disc" />
          ),
          ol: ({ node, ...props }) => (
            <ol {...props} className="my-3 space-y-2 pl-5 list-decimal" />
          ),
          li: ({ node, ...props }) => (
            <li {...props} className="my-1.5 pl-1.5 leading-relaxed" />
          ),
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
