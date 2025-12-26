
import { GoogleGenAI } from "@google/genai";

// Fix: Initializing GoogleGenAI using process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCaption = async (description: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a catchy TikTok-style caption with emojis for a video described as: "${description}". Keep it short and engaging.`,
    });
    return response.text?.trim() || "No caption generated.";
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
