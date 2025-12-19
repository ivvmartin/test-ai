/**
 * AI Module - Bulgarian VAT Legal Consultation System
 * 
 * Three-step AI processing flow:
 * 1. Query Analysis - Refine question and extract keywords
 * 2. Context Retrieval - Find relevant VAT articles
 * 3. Response Generation - Stream AI response with context
 */

export { geminiService } from "./gemini-service";
export { vatContentService } from "./vat-content-service";
export * from "./types";
export * from "./prompts";

