import "server-only";

import fs from "fs/promises";
import path from "path";

import { escapeHtml, markdownToHtml } from "./markdown-to-html";
import type { ConversationExport } from "./types";

/**
 * Loads the logo image and converts it to base64
 */
async function getLogoBase64(): Promise<string> {
  try {
    const logoPath = path.join(process.cwd(), "public", "brand.png");
    const logoBuffer = await fs.readFile(logoPath);
    return logoBuffer.toString("base64");
  } catch (error) {
    console.error("Failed to load logo:", error);
    return "";
  }
}

/**
 * Generates a complete HTML document for PDF export
 */
export async function generateHtmlTemplate(
  exportData: ConversationExport
): Promise<string> {
  const { metadata, messages } = exportData;

  const exportDate = new Date(metadata.exportedAt).toLocaleDateString(
    metadata.locale,
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const messagesHtml = await Promise.all(
    messages.map(async (message) => {
      const contentHtml = await markdownToHtml(message.content);

      const roleLabel =
        message.role === "user"
          ? "Вие"
          : message.role === "assistant"
          ? "ЕВТА AI"
          : "Система";

      return `
        <div class="message message-${escapeHtml(message.role)}">
          <div class="message-header">
            <span class="message-role">${escapeHtml(roleLabel)}</span>
          </div>
          <div class="message-content">
            ${contentHtml}
          </div>
        </div>
      `;
    })
  );

  return `
<!DOCTYPE html>
<html lang="${escapeHtml(metadata.locale)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(metadata.title)} - Експорт</title>
  <style>
    ${getStyles()}
  </style>
</head>
<body>
  <div class="document">
    <header class="document-header">
      <div class="header-content">
        <div class="header-text">
          <p class="brand-name">ЕВТА Консулт | Данъчен AI</p>
          <h1>${escapeHtml(metadata.title)}</h1>
        </div>
        <div class="header-logo">
          <img src="data:image/png;base64,${await getLogoBase64()}" alt="EVTA Logo" class="logo" />
        </div>
      </div>
    </header>

    <main class="messages-container">
      ${messagesHtml.join("\n")}
    </main>

    <footer class="document-footer">
      <p class="footer-brand">Генерирано от ЕВТА Консулт | Данъчен AI</p>
      <p class="footer-date">Експортирано на: ${escapeHtml(exportDate)}</p>
    </footer>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Returns CSS styles for the PDF document
 */
function getStyles(): string {
  return `
    @page {
      margin: 20mm 30mm 20mm 20mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: #ffffff;
    }

    .document {
      max-width: 100%;
      padding: 0;
      overflow: visible;
    }

    .document-header {
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid #333;
      overflow: visible;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      overflow: visible;
    }

    .header-text {
      flex: 1;
      padding-right: 30px;
      max-width: calc(100% - 85px);
    }

    .brand-name {
      font-size: 9pt;
      font-weight: 500;
      color: #333;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .document-header h1 {
      font-size: 18pt;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0;
      line-height: 1.3;
    }

    .header-logo {
      margin-left: 0;
      flex-shrink: 0;
      width: 70px;
      position: relative;
    }

    .logo {
      width: 70px;
      height: 70px;
      border-radius: 8px;
      object-fit: contain;
      display: block;
    }

    .messages-container {
      margin: 15px 0;
    }

    .message {
      margin-bottom: 15px;
      page-break-inside: auto;
      break-inside: auto;
    }

    .message:last-child {
      margin-bottom: 0;
    }

    .message-header {
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e5e5e5;
    }

    .message-role {
      font-weight: 600;
      font-size: 10pt;
      color: #333;
    }

    .message-content {
      padding: 8px 0;
      font-size: 10pt;
      line-height: 1.6;
    }

    /* Markdown content styling */
    .message-content h1,
    .message-content h2,
    .message-content h3 {
      margin-top: 16px;
      margin-bottom: 8px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .message-content h1 { font-size: 14pt; }
    .message-content h2 { font-size: 12pt; }
    .message-content h3 { font-size: 11pt; }

    .message-content p {
      margin: 8px 0;
    }

    .message-content ul,
    .message-content ol {
      margin: 8px 0;
      padding-left: 24px;
    }

    .message-content li {
      margin: 4px 0;
    }

    .message-content code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: "Courier New", Courier, monospace;
      font-size: 9pt;
    }

    .message-content pre {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 12px 0;
      border: 1px solid #e5e5e5;
    }

    .message-content pre code {
      background: none;
      padding: 0;
    }

    .message-content blockquote {
      border-left: 3px solid #333;
      padding-left: 12px;
      margin: 12px 0;
      color: #666;
      font-style: italic;
    }

    .message-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 9pt;
    }

    .message-content th,
    .message-content td {
      border: 1px solid #e5e5e5;
      padding: 6px 10px;
      text-align: left;
    }

    .message-content th {
      background: #f5f5f5;
      font-weight: 600;
    }

    .message-content a {
      color: #333;
      text-decoration: underline;
    }

    .document-footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
    }

    .footer-brand {
      font-size: 9pt;
      font-weight: 500;
      color: #333;
      margin: 0 0 4px 0;
    }

    .footer-date {
      font-size: 8pt;
      color: #666;
      margin: 0;
    }

    /* Print-specific rules */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .message-header {
        page-break-after: avoid;
      }

      .message-content {
        orphans: 3;
        widows: 3;
      }

      .message-content h1,
      .message-content h2,
      .message-content h3 {
        page-break-after: avoid;
      }

      .message-content pre,
      .message-content table {
        page-break-inside: avoid;
      }
    }
  `.trim();
}
