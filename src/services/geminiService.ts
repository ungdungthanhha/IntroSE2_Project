
import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY } from '@env';

// Fix: Initializing GoogleGenAI using environment variable
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const generateCaption = async (description: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a catchy TikTok-style caption with emojis for a video described as: "${description}". Keep it short and engaging.`,
    });
    const text = response.text || "";
      return text.trim() || "No caption generated.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Something went wrong with the AI.";
    }
};

export const simulateLiveChat = async (topic: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are simulating a TikTok live chat about "${topic}". Provide 5 realistic viewer comments like "OMG love this!", "Where are you?", "Send a galaxy!", etc. Return as a simple list.`,
    });
    return response.text?.split('\n').filter(line => line.length > 0) || [];
  } catch {
    return ["Nice vibe!", "Cool stream", "Hello from Paris!", "🔥", "Keep it up!"];
  }
};
