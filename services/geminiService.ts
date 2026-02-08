
import { GoogleGenAI, Type } from "@google/genai";
import { Verdict, AnalysisResult, GroundingSource, Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const languageNames: Record<Language, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  ar: 'Arabic'
};

/**
 * ScamShield Pro - Human-Centric Analysis Engine
 * 
 * Philosophy:
 * - Age-Inclusive: Friendly for 8 to 80 year olds.
 * - Calm: No technical jargon or scary warnings.
 * - Multi-Language: Localized reasoning and advice.
 * - Robust: Handles typos and transcription errors from voice input.
 */
export const analyzeMessage = async (
  content: string, 
  isImage: boolean = false,
  language: Language = 'en'
): Promise<AnalysisResult> => {
  try {
    const model = 'gemini-3-pro-preview';
    const targetLang = languageNames[language];
    
    const parts: any[] = [];
    if (isImage) {
      const [header, data] = content.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
      parts.push({ inlineData: { mimeType, data } });
      parts.push({ text: `Is this image or the text inside it a scam? Explain in very simple, kind words for a child or an elderly person. IMPORTANT: Your entire response must be in ${targetLang}.` });
    } else {
      parts.push({ text: `Analyze this message. Determine if it's a trick to get money or secrets. \n\nMESSAGE: ${content}\n\nIMPORTANT: Your entire response (verdict, reasoning, advice, indicators) must be in ${targetLang}.` });
    }

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        systemInstruction: `
        You are ScamShield Pro, a kind and protective digital guardian. 
        Your goal is to help people of all ages (kids to grandparents) understand if a message is a trick.

        RESPONSE STYLE:
        1. LANGUAGE: Use simple, Grade 5 level words. NO jargon.
        2. TARGET LANGUAGE: You MUST respond in ${targetLang}.
        3. TONE: Calm, reassuring, and never blaming. If a scam is found, say "Scammers are very clever, you did the right thing by checking."
        4. PANIC DETECTION: If the message sounds scary or rushed, explicitly tell the user to take a deep breath and that scammers use "hurry" to stop us from thinking.
        5. ROBUSTNESS: This input might be from a voice transcription. Ignore minor spelling mistakes or words that sound like others if the context implies a scam (e.g., "bank" vs "bang").
        
        JSON STRUCTURE (keys must remain as defined, but values must be in ${targetLang}):
        {
          "verdict": "SAFE" | "SUSPICIOUS" | "SCAM",
          "risk_score": 0-100,
          "indicators": ["short reason in ${targetLang}"],
          "reasoning": "Simple explanation in ${targetLang}.",
          "advice": "Simple next steps in ${targetLang}."
        }
        `,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verdict: { type: Type.STRING },
            risk_score: { type: Type.NUMBER },
            indicators: { type: Type.ARRAY, items: { type: Type.STRING } },
            reasoning: { type: Type.STRING },
            advice: { type: Type.STRING },
          },
          required: ["verdict", "risk_score", "indicators", "reasoning", "advice"],
        },
        tools: [{ googleSearch: {} }],
      },
    });

    const result = JSON.parse(response.text || '{}');
    
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title || 'Official Source', uri: chunk.web.uri });
        }
      });
    }

    return {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      content: isImage ? 'Picture' : content,
      contentType: isImage ? 'image' : 'text',
      verdict: (result.verdict || 'SUSPICIOUS').toUpperCase() as Verdict,
      riskScore: result.risk_score || 50,
      indicators: result.indicators || [],
      reasoning: result.reasoning || "Analysis complete.",
      advice: result.advice || "Standard precautions apply.",
      sources: sources.length > 0 ? sources : undefined,
      isDeepScan: true,
      imageUrl: isImage ? content : undefined,
    };
  } catch (error: any) {
    return {
      id: `err-${Date.now()}`,
      timestamp: Date.now(),
      content: 'System Check',
      contentType: isImage ? 'image' : 'text',
      verdict: Verdict.SUSPICIOUS,
      riskScore: 60,
      indicators: ['Safety Pause'],
      reasoning: "Analysis interrupted.",
      advice: "Please treat this as a trick and ask a friend for help.",
    };
  }
};
