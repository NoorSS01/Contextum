import { generateObject, LanguageModel } from 'ai';
import { z } from 'zod';
import { EvaluationMetrics } from '@shared/types';

const evaluationSchema = z.object({
  relevance: z.number().min(0).max(100).describe("Score 0-100: How relevant is the response to the user's prompt?"),
  coherence: z.number().min(0).max(100).describe("Score 0-100: How logical and well-structured is the response?"),
  completeness: z.number().min(0).max(100).describe("Score 0-100: Does the response fully address the query without missing parts?"),
  hallucinationRisk: z.number().min(0).max(100).describe("Score 0-100: How likely is it that the response contains factual errors or fabrications? (0 = no risk, 100 = very high risk)"),
  instructionAdherence: z.number().min(0).max(100).describe("Score 0-100: How well did the response follow the provided system instructions and format constraints?"),
  overall: z.number().min(0).max(100).describe("Score 0-100: The overall quality score of the response."),
});

export const evaluateResponse = async (
  model: LanguageModel,
  userPrompt: string,
  modelResponse: string,
  systemInstructions: string
): Promise<EvaluationMetrics> => {
  const prompt = `
You are an expert AI evaluator. Assess the quality of the following AI response against the user prompt and system constraints.

=== SYSTEM CONSTRAINTS / CONTEXT ===
${systemInstructions || 'None provided.'}

=== USER PROMPT ===
${userPrompt}

=== AI RESPONSE ===
${modelResponse}

Evaluate the response strictly using the requested JSON schema. Provide scores from 0 to 100.
`;

  try {
    const { object } = await generateObject({
      model,
      schema: evaluationSchema,
      prompt,
    });
    
    return object;
  } catch (err) {
    console.error("Evaluation error:", err);
    // Graceful degradation: return 0s instead of throwing so it doesn't break the UI
    return {
      relevance: 0,
      coherence: 0,
      completeness: 0,
      hallucinationRisk: 0,
      instructionAdherence: 0,
      overall: 0,
    };
  }
};
