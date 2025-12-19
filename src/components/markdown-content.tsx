import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@utils/index";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Renders markdown content with proper styling.
 * Supports GitHub Flavored Markdown (tables, strikethrough, task lists, etc.)
 */
export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const combinedClassName = cn(
    "prose prose-sm max-w-none dark:prose-invert",
    // Headings
    "prose-headings:font-semibold prose-headings:text-foreground",
    // Paragraphs
    "prose-p:text-foreground prose-p:leading-relaxed",
    // Lists
    "prose-ul:text-foreground prose-ol:text-foreground",
    "prose-li:text-foreground prose-li:marker:text-muted-foreground",
    // Links
    "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
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
    // Strong/Bold
    "prose-strong:text-foreground prose-strong:font-semibold",
    // Emphasis/Italic
    "prose-em:text-foreground",
    // Horizontal rules
    "prose-hr:border-border",
    className
  );

  return (
    <div className={combinedClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom rendering for specific elements if needed
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
