import { GoogleGenAI } from "@google/genai";
import { Update } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize generically. If key is missing, methods will throw/fail gracefully in the UI.
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateListingDescription = async (
  address: string,
  type: string,
  features: string,
  tone: string
): Promise<string> => {
  if (!API_KEY) {
    throw new Error("Missing API Key");
  }

  const prompt = `
    You are a professional real estate copywriter. 
    Write a compelling listing description for a ${type} property located at ${address}.
    
    Key Features:
    ${features}
    
    Tone: ${tone}
    
    Format the output with a catchy headline, a main paragraph, and a bulleted list of highlights.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate description.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate listing.");
  }
};

export const summarizeDealActivity = async (updates: Update[]): Promise<{ summary: string; nextSteps: string[] }> => {
  if (!API_KEY) {
    throw new Error("Missing API Key");
  }

  if (updates.length === 0) {
    return { summary: "No activity to summarize yet.", nextSteps: ["Reach out to client", "Review deal documents"] };
  }

  // Format updates for context
  const history = updates.map(u => `[${u.tag}] ${u.userName} (${u.timestamp}): ${u.content}`).join('\n');

  const prompt = `
    Analyze the following activity log for a real estate deal:
    
    ${history}
    
    1. Provide a 2-sentence summary of the current status.
    2. Suggest 3 concrete next steps for the agent.
    
    Output JSON format:
    {
      "summary": "...",
      "nextSteps": ["Step 1", "Step 2", "Step 3"]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return { summary: "Error analyzing.", nextSteps: [] };
    
    const json = JSON.parse(text);
    return {
      summary: json.summary || "No summary available.",
      nextSteps: json.nextSteps || []
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return { summary: "Could not analyze activity.", nextSteps: [] };
  }
};
