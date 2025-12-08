
import { GoogleGenAI } from "@google/genai";
import { Update, CrmData } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize generically. If key is missing, methods will throw/fail gracefully in the UI.
let ai: GoogleGenAI | null = null;
try {
    if (API_KEY) {
        ai = new GoogleGenAI({ apiKey: API_KEY });
    }
} catch (e) {
    console.error("Failed to initialize GoogleGenAI", e);
}

export const generateListingDescription = async (
  address: string,
  type: string,
  features: string,
  tone: string
): Promise<string> => {
  if (!ai) {
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
  if (!ai) {
    return { summary: "API Key Missing. Cannot analyze.", nextSteps: [] };
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

export const queryCRM = async (query: string, data: CrmData): Promise<string> => {
  if (!ai) {
    return "I'm sorry, but I don't have an API key configured to answer your questions.";
  }

  // Optimize context to fit typical context windows and reduce noise
  const context = {
    currentUser: data.user.displayName,
    deals: data.deals.map(d => ({
        address: d.address,
        client: d.clientName,
        status: d.status,
        price: d.price,
        type: d.type
    })),
    myTasks: data.tasks.filter(t => t.assignedToName === data.user.displayName).map(t => ({
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
        status: t.status
    })),
    activeOffers: data.offers.filter(o => o.status === 'Pending' || o.status === 'Countered').map(o => ({
        property: o.propertyAddress,
        buyer: o.clientName,
        amount: o.amount,
        status: o.status
    })),
    recentContacts: data.contacts.slice(0, 10).map(c => ({
        name: c.name,
        type: c.type,
        notes: c.notes
    }))
  };

  const prompt = `
    You are Nexus AI, an intelligent assistant for the "Reality Mark" Real Estate CRM.
    The current user is ${context.currentUser}.
    
    Here is the current snapshot of the CRM data (JSON format):
    ${JSON.stringify(context, null, 2)}
    
    User Query: "${query}"
    
    Answer the user's question based strictly on the data provided above. 
    If the answer is not in the data, say you don't know. 
    Be concise, professional, and helpful. Use formatting (like bullets) if listing items.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "I couldn't process that request.";
  } catch (error) {
    console.error("Gemini CRM Query Error:", error);
    return "I encountered an error while analyzing the data.";
  }
};
