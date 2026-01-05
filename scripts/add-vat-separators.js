#!/usr/bin/env node

/**
 * Script to add "---" separators between articles in Bulgarian VAT Act text
 *
 * Usage:
 *   node scripts/add-vat-separators.js input.txt output.txt
 */

const fs = require("fs");
const path = require("path");

function addSeparators(text) {
  const lines = text.split("\n");
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1] || "";

    // Check if the NEXT line starts with "Чл." (article)
    // If so, current line is likely the article title/description
    const isNextLineArticle = /^Чл\.\s*\d+[а-я]?\./.test(nextLine.trim());
    const isCurrentLineTitle =
      currentLine.trim() !== "" &&
      !currentLine.trim().startsWith("Чл.") &&
      !/^\d+\./.test(currentLine.trim()) && // Not a numbered item
      !/^[а-я]\)/.test(currentLine.trim()) && // Not a lettered item like "а)"
      !/^\(/.test(currentLine.trim()); // Not a parenthetical note

    // Add separator before article title (the line before "Чл. X.")
    if (isNextLineArticle && isCurrentLineTitle) {
      if (result.length > 0) {
        result.push("---");
      }
    }

    result.push(currentLine);
    i++;
  }

  let output = result.join("\n");

  // Add separator after the preamble/header (after amendment history)
  const headerMatch = output.match(
    /(ЗАКОН ЗА ДАНЪК ВЪРХУ ДОБАВЕНАТА СТОЙНОСТ[\s\S]*?(?:изм\. ДВ\. бр\.\d+[^.]*\.))\n/
  );
  if (headerMatch && !output.includes(headerMatch[1] + "\n---")) {
    output = output.replace(headerMatch[1] + "\n", headerMatch[1] + "\n---\n");
  }

  // Clean up any double separators
  output = output.replace(/\n---\n---/g, "\n---");

  return output;
}

function main() {
  const args = process.argv.slice(2);

  let inputText;
  let outputPath;

  if (args.length >= 1) {
    // Read from file
    const inputPath = args[0];
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: Input file not found: ${inputPath}`);
      process.exit(1);
    }
    inputText = fs.readFileSync(inputPath, "utf-8");
    outputPath = args[1] || null;
  } else {
    // Read from stdin
    inputText = fs.readFileSync(0, "utf-8");
  }

  const result = addSeparators(inputText);

  if (outputPath) {
    fs.writeFileSync(outputPath, result, "utf-8");
    console.log(`✅ Separators added. Output written to: ${outputPath}`);

    // Count separators
    const separatorCount = (result.match(/\n---\n/g) || []).length;
    console.log(`📊 Total separators added: ${separatorCount}`);
  } else {
    // Output to stdout
    process.stdout.write(result);
  }
}

main();
