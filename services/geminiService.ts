
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
    return "I need an API Key to answer that. Please check your configuration.";
  }

  // Create a simplified context to send to the model
  const context = {
    user: { name: data.user.displayName, role: data.user.role },
    deals: data.deals.map(d => ({ 
        id: d.id, 
        address: d.address, 
        client: d.clientName, 
        status: d.status, 
        price: d.price, 
        type: d.type 
    })),
    tasks: data.tasks.filter(t => t.status !== 'Completed').map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        due: t.dueDate,
        assignedTo: t.assignedToName
    })),
    offers: data.offers.map(o => ({
        property: o.propertyAddress,
        buyer: o.clientName,
        amount: o.amount,
        status: o.status
    })),
    contacts: data.contacts.slice(0, 20).map(c => ({ // Limit contacts
        name: c.name,
        type: c.type,
        email: c.email
    }))
  };

  const prompt = `
    You are Nexus AI, a helpful assistant for the Reality Mark Real Estate CRM.
    
    Context Data:
    ${JSON.stringify(context, null, 2)}
    
    User Query: "${query}"
    
    Instructions:
    1. Answer the user's question based strictly on the provided Context Data.
    2. If the user asks about "my tasks" or "my deals", filter by the current user (${context.user.name}).
    3. Keep the response concise, professional, and helpful.
    4. If the information is not in the context, say "I don't have that information right now."
    5. Do not invent data.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "I couldn't generate an answer.";
  } catch (error) {
    console.error("Gemini Query Error:", error);
    return "Sorry, I encountered an error while processing your request.";
  }
};
