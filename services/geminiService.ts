
import { GoogleGenAI, Type } from "@google/genai";
import { Verdict, AnalysisResult, GroundingSource } from "../types";
import { sanitizeInput, validateAIResponse } from "../utils/security";

const SYSTEM_INSTRUCTION = `
You are ScamShield Pro, a helpful and friendly digital security assistant. Your job is to help regular people stay safe from scams, phishing, and fake messages.

TONE & STYLE:
- Be clear, reassuring, and non-intimidating.
- Avoid heavy technical jargon unless explaining a specific red flag.
- Use simple terms: "Fake Link" instead of "Obfuscated URL", "Urgent Pressure" instead of "Social Engineering".

OUTPUT DIRECTIVES:
1. Verdict: SAFE, SUSPICIOUS, or SCAM.
2. Risk Score: 0-100 (0 is totally fine, 100 is definitely a scam).
3. Indicators: 3-5 clear red flags (e.g., "Mismatched sender", "Asking for password", "Too good to be true").
4. Reasoning: A friendly explanation of why you reached that verdict.
5. Advice: Clear, simple steps the user should take.

SAFE-BY-DEFAULT POLICY: If a message looks slightly weird or you're unsure, mark it as SUSPICIOUS to keep the user safe.

Your response MUST be in JSON format.
`;

const getFailSafeResult = (content: string, errorMsg: string): AnalysisResult => ({
  id: `err-${Math.random().toString(36).substring(7)}`,
  timestamp: Date.now(),
  content: content.slice(0, 100) + '...',
  contentType: 'text',
  verdict: Verdict.SUSPICIOUS,
  riskScore: 50,
  indicators: ['Technical Glitch'],
  reasoning: `We had a small trouble analyzing this specific message right now. To be safe, we've marked it as suspicious.`,
  // Fix: Use double quotes or escape the single quote to prevent syntax error on line 33
  advice: "Don't click any links in this message until you can verify it with a person you trust.",
});

export const analyzeMessage = async (
  rawContent: string, 
  isImage: boolean = false, 
  deepScan: boolean = false
): Promise<AnalysisResult> => {
  // Fix: Do not sanitize if it is an image to avoid truncating base64 data
  const content = isImage ? rawContent : sanitizeInput(rawContent);
  if (!content) {
    throw new Error("Please enter some text or upload an image to check.");
  }

  // Fix: Direct access to process.env.API_KEY is allowed, but ensure it exists
  if (!process.env.API_KEY) {
    return getFailSafeResult(isImage ? 'Image Scan' : content, "Missing connection");
  }

  // Always create a new instance before making an API call as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = isImage 
    ? 'gemini-2.5-flash-image' 
    : (deepScan ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview');

  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
  };

  // Rule: DO NOT set responseMimeType or responseSchema for nano banana series models (e.g., gemini-2.5-flash-image)
  if (!isImage) {
    config.responseMimeType = "application/json";
    config.responseSchema = {
      type: Type.OBJECT,
      properties: {
        verdict: { type: Type.STRING },
        riskScore: { type: Type.NUMBER },
        indicators: { type: Type.ARRAY, items: { type: Type.STRING } },
        reasoning: { type: Type.STRING },
        advice: { type: Type.STRING },
      },
      required: ['verdict', 'riskScore', 'indicators', 'reasoning', 'advice'],
    };
  }

  if (deepScan && !isImage) {
    config.tools = [{ googleSearch: {} }];
  }

  try {
    let response;
    if (isImage) {
      const base64Data = content.split(',')[1] || content;
      response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: "Please help me check if this screenshot shows a scam or a dangerous message. Respond only with JSON containing: verdict, riskScore, indicators, reasoning, advice." }
          ]
        },
        config
      });
    } else {
      response = await ai.models.generateContent({
        model: modelName,
        contents: content,
        config
      });
    }

    const rawText = response.text || '{}';
    let parsed;
    try {
      // Clean potential markdown if the model wrapped JSON in code blocks (likely for nano banana models)
      const cleanJson = rawText.replace(/```json\n?|```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      console.error("AI response parsing error:", rawText);
      return getFailSafeResult(isImage ? 'Image Scan' : content, "Response error");
    }

    if (!validateAIResponse(parsed)) {
      return getFailSafeResult(isImage ? 'Image Scan' : content, "Validation error");
    }

    const sources: GroundingSource[] = [];
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.groundingChunks) {
      groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    return {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      content: isImage ? 'Image Scan' : content,
      contentType: isImage ? 'image' : 'text',
      verdict: parsed.verdict as Verdict,
      riskScore: parsed.riskScore,
      indicators: parsed.indicators,
      reasoning: parsed.reasoning,
      advice: parsed.advice,
      sources: sources.length > 0 ? sources : undefined,
      isDeepScan: deepScan,
      imageUrl: isImage ? content : undefined,
    };
  } catch (error: any) {
    return getFailSafeResult(isImage ? 'Image Scan' : content, error?.message || "Internal error");
  }
};
