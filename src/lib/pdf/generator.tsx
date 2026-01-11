/**
 * PDF export generator (no Playwright / no Chromium)
 */

import "server-only";

import {
  Document,
  Font,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import fs from "fs/promises";
import path from "path";
import { remark } from "remark";
import remarkGfm from "remark-gfm";

import type { ChatExport } from "./types";

// A4 in points
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

// Page padding
const MARGIN_LEFT = 45;
const MARGIN_RIGHT = 45;
const MARGIN_TOP = 60;

// Footer sizing
const FOOTER_BOTTOM_OFFSET = 32; // visual offset from bottom edge
const FOOTER_DIVIDER_HEIGHT = 1;
const FOOTER_GAP_BELOW_DIVIDER = 6;
const FOOTER_TEXT_FONT_SIZE = 8;
const FOOTER_LINE_HEIGHT = 1.2;
const FOOTER_RESERVED_HEIGHT = 34;

// Bottom padding includes reserved footer + a small safety buffer
const MARGIN_BOTTOM = FOOTER_BOTTOM_OFFSET + FOOTER_RESERVED_HEIGHT + 10;

type MdastNode = {
  type: string;
  value?: string;
  depth?: number;
  ordered?: boolean;
  start?: number;
  url?: string;
  children?: MdastNode[];
};

type InlineRun =
  | { type: "text"; value: string }
  | { type: "strong"; children: InlineRun[] }
  | { type: "em"; children: InlineRun[] }
  | { type: "inlineCode"; value: string }
  | { type: "link"; url: string; children: InlineRun[] }
  | { type: "hardBreak" };

type Block =
  | { type: "h1"; inlines: InlineRun[] }
  | { type: "h2"; inlines: InlineRun[] }
  | { type: "h3"; inlines: InlineRun[] }
  | { type: "p"; inlines: InlineRun[] }
  | {
      type: "li";
      ordered: boolean;
      index: number;
      indent: number;
      inlines: InlineRun[];
    }
  | { type: "hr" };

/* =============================== FONTS =============================== */

let interFontsRegistered = false;

function ensureFontsRegistered(): void {
  if (interFontsRegistered) return;

  const interRegularPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "Inter-Regular.ttf"
  );
  const interBoldPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "Inter-Bold.ttf"
  );

  Font.register({
    family: "Inter",
    fonts: [
      { src: interRegularPath, fontWeight: "normal" },
      { src: interBoldPath, fontWeight: "bold" },
    ],
  });

  interFontsRegistered = true;
}

/* =============================== MAIN ENTRY =============================== */

export async function generatePDF(exportData: ChatExport): Promise<Buffer> {
  validateExportData(exportData);
  ensureFontsRegistered();

  const logoDataUrl = await loadLogoDataUrl(
    path.join(process.cwd(), "public", "brand-light.png")
  );

  const parsedMessages = await Promise.all(
    exportData.messages.map(async (m) => ({
      role: m.role,
      blocks: await parseMarkdownToBlocks(m.content),
    }))
  );

  const doc = (
    <PdfDocument
      exportData={exportData}
      logoDataUrl={logoDataUrl}
      messages={parsedMessages}
    />
  );

  const pdfInstance = pdf(doc);
  const blob = await pdfInstance.toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function PdfDocument(props: {
  exportData: ChatExport;
  logoDataUrl: string | null;
  messages: Array<{ role: string; blocks: Block[] }>;
}) {
  const { exportData, logoDataUrl, messages } = props;

  return (
    <Document
      title={`${exportData.metadata.title} - Експорт`}
      author="EVTA AI | Данъчен Асистент"
      language={exportData.metadata.locale}
    >
      <Page
        size={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }}
        style={styles.page}
        wrap
      >
        <Header title={exportData.metadata.title} logoDataUrl={logoDataUrl} />

        <View style={styles.messages}>
          {messages.map((m, idx) => (
            <Message key={idx} role={m.role} blocks={m.blocks} />
          ))}
        </View>

        <Disclaimer />

        <Footer />
      </Page>
    </Document>
  );
}

function Header(props: { title: string; logoDataUrl: string | null }) {
  const { title, logoDataUrl } = props;

  return (
    <View style={styles.header}>
      {/* Render logo only if it exists */}
      {logoDataUrl ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image src={logoDataUrl} style={styles.logo} />
      ) : (
        <View style={styles.logoPlaceholder} />
      )}

      <View style={styles.headerText}>
        <Text style={styles.brand}>EVTA AI | ДАНЪЧЕН АСИСТЕНТ</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

function Disclaimer() {
  return (
    <View style={styles.disclaimer} wrap>
      <View style={styles.disclaimerDivider} />
      <Text style={styles.disclaimerText}>
        Този отговор е автоматично генериран от AI асистент и има информативен
        характер. Не представлява правен или данъчен съвет. Възможни са
        неточности.{"\n\n"}
        Преди прилагане на данъчното законодателство се консултирайте с
        квалифициран специалист.{"\n"}
        Ако предпочитате консултация с човек, можете да се свържете по всяко
        време с нашия експертен екип от адвокати по данъчно право:{"\n"}
        <Link src="https://www.evtaconsult.com" style={styles.disclaimerLink}>
          www.evtaconsult.com
        </Link>
        {"\n"}
        <Link src="mailto:ai@evtaconsult.com" style={styles.disclaimerLink}>
          ai@evtaconsult.com
        </Link>
      </Text>
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <View style={styles.footerDivider} />
      <Text style={styles.footerText}>
        Генерирано от EVTA AI | Данъчен Асистент
      </Text>
    </View>
  );
}

function Message(props: { role: string; blocks: Block[] }) {
  const roleLabel =
    props.role === "user"
      ? "Вие"
      : props.role === "assistant"
      ? "EVTA AI"
      : "Система";

  return (
    <View style={styles.message} wrap>
      <Text style={styles.role}>{roleLabel}</Text>
      <View style={styles.roleDivider} />
      <View style={styles.messageBody}>
        {props.blocks.map((b, i) => (
          <BlockRenderer key={i} block={b} />
        ))}
      </View>
    </View>
  );
}

function BlockRenderer(props: { block: Block }) {
  const { block } = props;

  switch (block.type) {
    case "h1":
      return (
        <Text style={styles.h1} wrap>
          <InlineRuns runs={block.inlines} />
        </Text>
      );

    case "h2":
      return (
        <Text style={styles.h2} wrap>
          <InlineRuns runs={block.inlines} />
        </Text>
      );

    case "h3":
      return (
        <Text style={styles.h3} wrap>
          <InlineRuns runs={block.inlines} />
        </Text>
      );

    case "p":
      return (
        <Text style={styles.p} wrap>
          <InlineRuns runs={block.inlines} />
        </Text>
      );

    case "li": {
      const marker = block.ordered ? `${block.index}.` : "•";
      const leftPad = 14 + block.indent * 16;

      return (
        <View style={[styles.liRow, { marginLeft: leftPad }]} wrap>
          <Text style={styles.liMarker}>{marker}</Text>
          <Text style={styles.liText} wrap>
            <InlineRuns runs={block.inlines} />
          </Text>
        </View>
      );
    }

    case "hr":
      return <View style={styles.hr} />;

    default:
      return null;
  }
}

/* ============================ INLINE RENDERING ============================ */

function InlineRuns(props: { runs: InlineRun[] }) {
  const { runs } = props;

  return (
    <>
      {runs.map((r, i) => {
        switch (r.type) {
          case "text":
            return <Text key={i}>{r.value}</Text>;

          case "hardBreak":
            return <Text key={i}>{"\n"}</Text>;

          case "strong":
            return (
              <Text key={i} style={styles.strong}>
                <InlineRuns runs={r.children} />
              </Text>
            );

          case "em":
            return (
              <Text key={i} style={styles.em}>
                <InlineRuns runs={r.children} />
              </Text>
            );

          case "inlineCode":
            return (
              <Text key={i} style={styles.inlineCode}>
                {r.value}
              </Text>
            );

          case "link":
            return (
              <Text key={i} style={styles.link}>
                <InlineRuns runs={r.children} />
              </Text>
            );

          default:
            return null;
        }
      })}
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: MARGIN_TOP,
    paddingBottom: MARGIN_BOTTOM,
    paddingLeft: MARGIN_LEFT,
    paddingRight: MARGIN_RIGHT,
    fontFamily: "Inter",
    fontSize: 10,
    color: "#1a1a1a",
    lineHeight: 1.45,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  logo: {
    width: 100,
    height: 48,
    marginRight: 16,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  brand: {
    fontSize: 9,
    color: "#666",
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 1.3,
  },

  messages: {},

  message: {
    marginBottom: 14,
  },
  role: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 6,
  },
  roleDivider: {
    height: 1,
    backgroundColor: "#e5e5e5",
    marginBottom: 10,
  },
  messageBody: {},

  h1: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 6,
    lineHeight: 1.25,
  },
  h2: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 6,
    lineHeight: 1.25,
  },
  h3: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
    lineHeight: 1.25,
  },

  p: {
    marginTop: 3,
    marginBottom: 6,
  },

  liRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 2,
    marginBottom: 2,
  },
  liMarker: {
    width: 16,
    fontWeight: "normal",
  },
  liText: {
    flexGrow: 1,
  },

  hr: {
    height: 1,
    backgroundColor: "#e5e5e5",
    marginTop: 10,
    marginBottom: 10,
  },

  strong: {
    fontWeight: "bold",
  },
  em: {},
  inlineCode: {
    fontSize: 9,
  },
  link: {
    textDecoration: "underline",
  },
  disclaimer: {
    marginTop: 20,
    marginBottom: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  disclaimerDivider: {
    height: FOOTER_DIVIDER_HEIGHT,
    backgroundColor: "#e5e5e5",
    marginBottom: 12,
  },
  disclaimerText: {
    fontSize: 8,
    lineHeight: 1.4,
    color: "#666666",
    textAlign: "left",
  },
  disclaimerLink: {
    color: "#003d99",
    textDecoration: "underline",
  },
  footer: {
    position: "absolute",
    left: MARGIN_LEFT,
    right: MARGIN_RIGHT,
    bottom: FOOTER_BOTTOM_OFFSET,
    textAlign: "center",
  },
  footerDivider: {
    height: FOOTER_DIVIDER_HEIGHT,
    backgroundColor: "#e5e5e5",
    marginBottom: FOOTER_GAP_BELOW_DIVIDER,
  },
  footerText: {
    fontSize: FOOTER_TEXT_FONT_SIZE,
    lineHeight: FOOTER_LINE_HEIGHT,
    color: "#666666",
  },
});

/* =========================== MARKDOWN -> BLOCKS =========================== */

async function parseMarkdownToBlocks(markdown: string): Promise<Block[]> {
  const tree = remark().use(remarkGfm).parse(markdown) as MdastNode;
  const out: Block[] = [];

  for (const node of tree.children ?? []) {
    walkBlocks(node, out, 0);
  }

  return out.filter((b) => !isEmptyBlock(b));
}

function walkBlocks(node: MdastNode, out: Block[], indent: number): void {
  switch (node.type) {
    case "heading": {
      const depth = node.depth ?? 1;
      const inlines = toInlineRuns(node);
      if (!hasInlineText(inlines)) return;

      if (depth === 1) out.push({ type: "h1", inlines });
      else if (depth === 2) out.push({ type: "h2", inlines });
      else out.push({ type: "h3", inlines });
      return;
    }

    case "paragraph": {
      const inlines = toInlineRuns(node);
      if (!hasInlineText(inlines)) return;

      out.push({ type: "p", inlines });
      return;
    }

    case "thematicBreak": {
      out.push({ type: "hr" });
      return;
    }

    case "list": {
      const ordered = Boolean(node.ordered);
      const start = typeof node.start === "number" ? node.start : 1;
      let idx = start;

      for (const item of node.children ?? []) {
        if (item.type !== "listItem") continue;

        const itemInlines = toInlineRunsListItemContent(item);
        if (hasInlineText(itemInlines)) {
          out.push({
            type: "li",
            ordered,
            index: idx,
            indent,
            inlines: itemInlines,
          });
        }

        for (const c of item.children ?? []) {
          if (c.type === "list") walkBlocks(c, out, indent + 1);
        }

        if (ordered) idx++;
      }
      return;
    }

    case "blockquote": {
      const inlines = toInlineRuns(node);
      if (!hasInlineText(inlines)) return;
      out.push({ type: "p", inlines });
      return;
    }

    default: {
      if (node.children) {
        for (const c of node.children) walkBlocks(c, out, indent);
      }
    }
  }
}

function toInlineRuns(node: MdastNode): InlineRun[] {
  const runs: InlineRun[] = [];

  const walk = (n: MdastNode) => {
    switch (n.type) {
      case "text":
        if (n.value) runs.push({ type: "text", value: n.value });
        return;

      case "strong": {
        const children = toInlineRunsFromChildren(n);
        if (children.length) runs.push({ type: "strong", children });
        return;
      }

      case "emphasis": {
        const children = toInlineRunsFromChildren(n);
        if (children.length) runs.push({ type: "em", children });
        return;
      }

      case "inlineCode":
        runs.push({ type: "inlineCode", value: n.value ?? "" });
        return;

      case "link": {
        const children = toInlineRunsFromChildren(n);
        runs.push({
          type: "link",
          url: n.url ?? "",
          children: children.length
            ? children
            : [{ type: "text", value: n.url ?? "" }],
        });
        return;
      }

      case "break":
      case "hardBreak":
        runs.push({ type: "hardBreak" });
        return;

      default:
        if (n.children) n.children.forEach(walk);
        return;
    }
  };

  if (node.children) node.children.forEach(walk);
  return mergeAdjacentTextRuns(runs);
}

function toInlineRunsListItemContent(listItem: MdastNode): InlineRun[] {
  const runs: InlineRun[] = [];

  // Only paragraphs count as the textual content of the list item.
  // Nested lists are handled separately in walkBlocks to avoid duplication
  for (const child of listItem.children ?? []) {
    if (child.type === "paragraph") {
      runs.push(...toInlineRuns(child));
    }
  }

  return mergeAdjacentTextRuns(runs);
}

function toInlineRunsFromChildren(node: MdastNode): InlineRun[] {
  const tmp: InlineRun[] = [];

  const walk = (n: MdastNode) => {
    switch (n.type) {
      case "text":
        if (n.value) tmp.push({ type: "text", value: n.value });
        return;

      case "strong": {
        const children = toInlineRunsFromChildren(n);
        if (children.length) tmp.push({ type: "strong", children });
        return;
      }

      case "emphasis": {
        const children = toInlineRunsFromChildren(n);
        if (children.length) tmp.push({ type: "em", children });
        return;
      }

      case "inlineCode":
        tmp.push({ type: "inlineCode", value: n.value ?? "" });
        return;

      case "link": {
        const children = toInlineRunsFromChildren(n);
        tmp.push({
          type: "link",
          url: n.url ?? "",
          children: children.length
            ? children
            : [{ type: "text", value: n.url ?? "" }],
        });
        return;
      }

      case "break":
      case "hardBreak":
        tmp.push({ type: "hardBreak" });
        return;

      default:
        if (n.children) n.children.forEach(walk);
        return;
    }
  };

  if (node.children) node.children.forEach(walk);
  return mergeAdjacentTextRuns(tmp);
}

function mergeAdjacentTextRuns(runs: InlineRun[]): InlineRun[] {
  const out: InlineRun[] = [];
  for (const r of runs) {
    const last = out[out.length - 1];
    if (r.type === "text" && last?.type === "text") last.value += r.value;
    else out.push(r);
  }
  return out;
}

function hasInlineText(runs: InlineRun[]): boolean {
  return inlineRunsToPlainText(runs).trim().length > 0;
}

function inlineRunsToPlainText(runs: InlineRun[]): string {
  let s = "";
  for (const r of runs) {
    if (r.type === "text") s += r.value;
    else if (r.type === "inlineCode") s += r.value;
    else if (r.type === "hardBreak") s += "\n";
    else if (r.type === "strong" || r.type === "em")
      s += inlineRunsToPlainText(r.children);
    else if (r.type === "link") s += inlineRunsToPlainText(r.children);
  }
  return s;
}

function isEmptyBlock(b: Block): boolean {
  if (b.type === "hr") return false;
  if (b.type === "li")
    return inlineRunsToPlainText(b.inlines).trim().length === 0;

  return (
    inlineRunsToPlainText((b as { inlines?: InlineRun[] }).inlines ?? []).trim()
      .length === 0
  );
}

/* ================================== MISC ================================== */

async function loadLogoDataUrl(filePath: string): Promise<string | null> {
  try {
    const buf = await fs.readFile(filePath);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export function validateExportData(exportData: ChatExport): void {
  if (!exportData.metadata?.chatId) {
    throw new Error("Missing chat ID in export metadata");
  }
  if (!exportData.metadata?.title) {
    throw new Error("Missing title in export metadata");
  }
  if (!exportData.messages || !Array.isArray(exportData.messages)) {
    throw new Error("Invalid messages array in export data");
  }
  if (exportData.messages.length === 0) {
    throw new Error("Cannot export chat with no messages");
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(message as any).createdAt) {
      throw new Error("Missing createdAt timestamp in message");
    }
  }
}
