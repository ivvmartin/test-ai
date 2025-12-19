import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { VATContent, ContextRetrievalResult } from "./types";

/**
 * VAT Content Service
 *
 * Handles retrieval of Bulgarian VAT Act and Regulations content
 * using PostgreSQL full-text search with Bulgarian language configuration.
 *
 * SERVER-ONLY - Never import this in client components.
 */
class VATContentService {
  /**
   * Step 2: Find Relevant Content
   *
   * Searches the vat_content table using PostgreSQL full-text search
   * to find relevant articles from ЗДДС and ППЗДДС.
   *
   * @param keywords - Array of search keywords from Step 1
   * @returns Context strings for ЗДДС and ППЗДДС, plus found articles
   */
  async findRelevantContent(
    keywords: string[]
  ): Promise<ContextRetrievalResult> {
    console.log("🔍 [Context Retrieval] Starting...");
    console.log("📋 [Search Keywords]", { keywords, count: keywords.length });

    if (keywords.length === 0) {
      console.log(
        "⚠️  [Context Retrieval] No keywords provided - returning empty context"
      );
      return {
        actContext: "",
        regulationsContext: "",
        foundArticles: [],
      };
    }

    const supabase = createAdminClient();

    // Join keywords into a search query
    // For plainto_tsquery, just use space-separated keywords
    const searchQuery = keywords.join(" ");

    console.log("🔎 [Search Query]", {
      searchQuery,
      config: "bulgarian",
      keywords,
      keywordCount: keywords.length,
    });

    try {
      // Use RPC to call PostgreSQL full-text search directly
      // This ensures we're using plainto_tsquery with Bulgarian config correctly
      const { data, error } = await supabase.rpc("search_vat_content", {
        search_query: searchQuery,
        max_results: 20,
      });

      console.log("🔍 [Search Result]", {
        found: data?.length || 0,
        hasError: !!error,
      });

      if (error) {
        console.error(
          "❌ [Context Retrieval] Error searching VAT content:",
          error
        );
        return {
          actContext: "",
          regulationsContext: "",
          foundArticles: [],
        };
      }

      if (!data || data.length === 0) {
        console.log(
          "⚠️  [Context Retrieval] No articles found for keywords:",
          keywords
        );
        return {
          actContext: "",
          regulationsContext: "",
          foundArticles: [],
        };
      }

      // Separate articles by source
      const actArticles = data.filter((item: any) => item.source === "ЗДДС");
      const regulationsArticles = data.filter(
        (item: any) => item.source === "ППЗДДС"
      );

      console.log("✅ [Context Retrieval] Found articles:", {
        total: data.length,
        ЗДДС: actArticles.length,
        ППЗДДС: regulationsArticles.length,
      });

      // Log article numbers for debugging
      console.log("📄 [ЗДДС Articles]", {
        articles: actArticles.map((a: any) => a.article_number).join(", "),
      });
      console.log("📄 [ППЗДДС Articles]", {
        articles: regulationsArticles
          .map((a: any) => a.article_number)
          .join(", "),
      });

      // Format context strings
      const actContext = this.formatArticles(actArticles);
      const regulationsContext = this.formatArticles(regulationsArticles);

      console.log("📊 [Context Size]", {
        actContextLength: actContext.length,
        regulationsContextLength: regulationsContext.length,
        totalContextLength: actContext.length + regulationsContext.length,
      });

      return {
        actContext,
        regulationsContext,
        foundArticles: data as VATContent[],
      };
    } catch (error) {
      console.error("❌ [Context Retrieval] Unexpected error:", error);
      return {
        actContext: "",
        regulationsContext: "",
        foundArticles: [],
      };
    }
  }

  /**
   * Format articles into a readable context string
   */
  private formatArticles(articles: any[]): string {
    if (articles.length === 0) {
      return "";
    }

    return articles
      .map((article) => {
        return `Член ${article.article_number}:\n${article.content}`;
      })
      .join("\n\n---\n\n");
  }

  /**
   * Seed VAT content into the database
   *
   * This is a helper method for initial data loading.
   * Should be called from a seeding script.
   *
   * @param content - Array of VAT content items to insert
   */
  async seedContent(
    content: Array<{
      source: "ЗДДС" | "ППЗДДС";
      article_number: string;
      content: string;
    }>
  ): Promise<void> {
    const supabase = createAdminClient();

    const { error } = await supabase.from("vat_content").insert(content);

    if (error) {
      console.error("Error seeding VAT content:", error);
      throw error;
    }

    console.log(`Successfully seeded ${content.length} VAT content items`);
  }

  /**
   * Clear all VAT content from the database
   *
   * Use with caution! This deletes all content.
   */
  async clearContent(): Promise<void> {
    const supabase = createAdminClient();

    const { error } = await supabase.from("vat_content").delete().neq("id", "");

    if (error) {
      console.error("Error clearing VAT content:", error);
      throw error;
    }

    console.log("Successfully cleared all VAT content");
  }
}

// Export singleton instance
export const vatContentService = new VATContentService();
