import "server-only";

import { chromium } from "playwright";

import type { ConversationExport, PDFGenerationOptions } from "./types";
import { DEFAULT_PDF_OPTIONS } from "./types";
import { generateHtmlTemplate } from "./html-template";

/**
 * Generates a PDF from conversation export data
 *
 * Uses Playwright's Chromium browser to render HTML to PDF
 * Ensures deterministic output and proper Cyrillic support
 */
export async function generatePDF(
  exportData: ConversationExport,
  options: PDFGenerationOptions = DEFAULT_PDF_OPTIONS
): Promise<Buffer> {
  let browser;

  try {
    // 1. Generate HTML template
    const html = await generateHtmlTemplate(exportData);

    // 2. Launch headless browser
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const context = await browser.newContext({
      locale: exportData.metadata.locale,
    });

    const page = await context.newPage();

    // 3. Set content and wait for it to be ready
    await page.setContent(html, {
      waitUntil: "networkidle",
    });

    // 4. Generate PDF
    const pdfBuffer = await page.pdf({
      format: options.format,
      margin: options.margin,
      displayHeaderFooter: options.displayHeaderFooter,
      printBackground: options.printBackground,
      preferCSSPageSize: false,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error(
      `Failed to generate PDF: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    // 5. Always close the browser
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Validates export data before PDF generation
 */
export function validateExportData(exportData: ConversationExport): void {
  if (!exportData.metadata?.conversationId) {
    throw new Error("Missing conversation ID in export metadata");
  }

  if (!exportData.metadata?.title) {
    throw new Error("Missing title in export metadata");
  }

  if (!exportData.messages || !Array.isArray(exportData.messages)) {
    throw new Error("Invalid messages array in export data");
  }

  if (exportData.messages.length === 0) {
    throw new Error("Cannot export conversation with no messages");
  }

  for (const message of exportData.messages) {
    if (
      !message.role ||
      !["user", "assistant", "system"].includes(message.role)
    ) {
      throw new Error(`Invalid message role: ${message.role}`);
    }

    if (typeof message.content !== "string") {
      throw new Error("Invalid message content: must be a string");
    }

    if (!message.createdAt) {
      throw new Error("Missing createdAt timestamp in message");
    }
  }
}
