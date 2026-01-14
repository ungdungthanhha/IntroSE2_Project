
import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY } from '@env';

// Fix: Initializing GoogleGenAI using environment variable
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const generateCaption = async (description: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a social media expert. Create a viral TikTok caption based on this context: "${description}".
      
      Requirements:
      - Use engaging, trendy language (Gen Z slang is okay if fits).
      - Include 2-3 relevant emojis.
      - Add 3-5 popular, relevant hashtags.
      - Keep it under 2 sentences.`,
    });
    const text = response.text || "";
    return text.trim() || "No caption generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Something went wrong with the AI.";
  }
};


