import { GoogleGenAI, Type, FunctionDeclaration, Schema } from "@google/genai";
import { DEFAULT_SYSTEM_INSTRUCTION } from "../constants";
import { SectAnalysis } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Text Chat with Knowledge
export const sendChatMessage = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  useSearch: boolean = false
): Promise<string> => {
  try {
    const modelId = useSearch ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
        tools: useSearch ? [{ googleSearch: {} }] : undefined,
      },
      history: history,
    });

    const response = await chat.sendMessage({ message: newMessage });
    
    // Check for grounding (search results) and append if exists
    let finalText = response.text || "No response generated.";
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && chunks.length > 0) {
       const sources = chunks
        .filter((c: any) => c.web?.uri)
        .map((c: any) => `[${c.web.title}](${c.web.uri})`)
        .join('\n');
       if (sources) {
         finalText += `\n\n**参考来源:**\n${sources}`;
       }
    }

    return finalText;
  } catch (error) {
    console.error("Chat Error:", error);
    return "抱歉，大侠，由于网络波动，在下暂时无法回应。（API Error）";
  }
};

// 2. Sect Analysis (JSON Output)
export const analyzeSect = async (sectName: string): Promise<SectAnalysis | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the JX3 sect: ${sectName}. Provide a short lore description, a representative poem line (if known, or generic wuxia style), and numerical stats (0-100) for attack, defense, support, mobility, and difficulty.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            poem: { type: Type.STRING },
            stats: {
              type: Type.OBJECT,
              properties: {
                attack: { type: Type.NUMBER },
                defense: { type: Type.NUMBER },
                support: { type: Type.NUMBER },
                mobility: { type: Type.NUMBER },
                difficulty: { type: Type.NUMBER },
              },
              required: ["attack", "defense", "support", "mobility", "difficulty"],
            },
          },
          required: ["name", "description", "stats"],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as SectAnalysis;
  } catch (error) {
    console.error("Analysis Error:", error);
    return null;
  }
};

// 3. Image Generation (Character Concepts)
export const generateCharacterImage = async (prompt: string): Promise<string | null> => {
  try {
    const fullPrompt = `A high quality, digital painting of a character from the chinese wuxia game Jian Wang 3 (JX3). Style: detailed, elegant, fantasy martial arts. Description: ${prompt}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: fullPrompt,
      config: {
        // No responseMimeType for this model when generating images via generateContent
      }
    });

    // Iterate parts to find image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};
