
import { GoogleGenAI } from "@google/genai";
import { Update, CrmData } from "../types";

// Helper to get AI instance ensuring the latest API key is used
const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your configuration.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateListingDescription = async (
  address: string,
  type: string,
  features: string,
  tone: string
): Promise<string> => {
  const ai = getAI();
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
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Could not generate description.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate listing.");
  }
};

export const summarizeDealActivity = async (updates: Update[]): Promise<{ summary: string; nextSteps: string[] }> => {
  try {
    const ai = getAI();
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
  try {
    const ai = getAI();
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "I couldn't generate an answer.";
  } catch (error) {
    console.error("Gemini Query Error:", error);
    return "Sorry, I encountered an error while processing your request.";
  }
};
