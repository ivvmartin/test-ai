export const SYSTEM_INSTRUCTION = `## Roles

You are especially skilled at synthesizing legal research, analyzing complex factual issues, and drafting well-supported, logical, creative, and compelling opinion on the question. You always seek to provide the highest quality work-product for the assigned task.

## Rules
Prioritize Provided Context: For each question, you may receive context sections containing relevant articles from the Bulgarian VAT Act (ЗДДС) and/or the Regulations for its Application (ППЗДДС). You MUST base your answer primarily on these provided articles.
Foundation: If the provided context is insufficient or not available, you may use your general knowledge of the Bulgarian VAT Act (ЗДДС) and its Regulations, but you should prioritize the provided text if it exists.
Clarity: Provide clear, concise, and easy-to-understand explanations. When possible, cite the specific article or paragraph of the law your answer is based on (e.g., 'съгласно чл. X, ал. Y от ЗДДС...' or 'съгласно чл. Z от ППЗДДС...').
Language: Respond primarily in Bulgarian, as the legal context is Bulgarian. Provide helpful, detailed, and logical responses to my prompts. Walk me through your analysis and always explain your reasoning.
Scope: If a question falls outside the scope of the ЗДДС or ППЗДДС, politely state that your knowledge is limited to these specific laws.
No Speculation: Do not provide interpretations or opinions that are not directly supported by the text of the law. If the law is ambiguous on a certain point, state that and suggest consulting a professional.
Tone: Your tone should be professional, helpful, and authoritative, like a knowledgeable tax consultant.`;

export function buildAnalysisPrompt(
  conversationHistory: string,
  currentQuestion: string
): string {
  return `You are a legal expert assistant specializing in the Bulgarian VAT Act. Your task is to analyze a user's question and prepare it for a final query to a large language model.
  
  Here is the conversation history so far:
  ${conversationHistory}

  Latest user's question:
  ${currentQuestion}

  INSTRUCTIONS:
  1. Identify the key legal concepts and topics involved, considering the full conversation for context.
  2. Formulate a clear, refined question in Bulgarian that is more precise for querying a legal text database. This question should incorporate context from previous turns if it's a follow-up question.
  3. Provide a list of keywords/phrases in Bulgarian to search for relevant articles in the VAT Act text. These keywords should be relevant to the user's latest question in the context of the conversation.

  OUTPUT FORMAT:
  Return JSON object with the following structure:
  {
    "refined_question": "Прецизираният въпрос на български език",
    "search_keywords": ["ключова дума 1", "ключова дума 2", "ключова дума 3", ...]
  }
  
  IMPORTANT: Answer ONLY the JSON object. Do not include any additional text or explanation.`;
}

export function buildFinalPrompt(
  refinedQuestion: string,
  actContext: string,
  regulationsContext: string
): string {
  console.log("📝 [Prompt Builder] Building final prompt...");
  console.log("📋 [Prompt Input]", {
    refinedQuestion: refinedQuestion.substring(0, 100) + "...",
    hasActContext: !!actContext,
    hasRegulationsContext: !!regulationsContext,
    actContextLength: actContext.length,
    regulationsContextLength: regulationsContext.length,
  });

  if (!actContext && !regulationsContext) {
    // No context found - just ask the question
    console.log(
      "⚠️  [Prompt Builder] No context available - using question only"
    );
    return refinedQuestion;
  }

  let prompt = "";

  if (actContext) {
    prompt += `CONTEXT FROM ZDDS:\n${actContext}\n\n`;
    console.log("✅ [Prompt Builder] Added ЗДДС context");
  }

  if (regulationsContext) {
    prompt += `CONTEXT FROM PPZDDS:\n${regulationsContext}\n\n`;
    console.log("✅ [Prompt Builder] Added ППЗДДС context");
  }
  prompt += `In accordance with the above context, answer the following question:\n\n"${refinedQuestion}"`;

  console.log("📊 [Final Prompt]", {
    totalLength: prompt.length,
    hasContextInstruction: prompt.includes(
      "In accordance with the above context"
    ),
  });

  return prompt;
}
