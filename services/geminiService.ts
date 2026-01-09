
import { GoogleGenAI, Type } from "@google/genai";
import { Update, CrmData, Deal, Offer, Contact, SmartImportRecord, PropertyLookupResult } from "../types";

const getAI = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your configuration.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getDailyBriefing = async (data: CrmData): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `
      You are a senior real estate operations manager.
      Based on the following data about deals, offers, tasks, and last contact dates, tell the agent the TOP 5 actions they should focus on today.

      Rules:
      - Prioritize urgent deadlines first
      - Then stuck deals
      - Then important follow-ups
      - Be concise and actionable

      Return output in bullet points with emojis:
      🔴 Urgent
      🟡 Important
      🟢 Optional

      DATA:
      Deals: ${JSON.stringify(data.deals.map(d => ({ id: d.id, address: d.property_address, status: d.status, type: d.type })))}
      Offers: ${JSON.stringify(data.offers.map(o => ({ status: o.status, amount: o.amount, property: o.propertyAddress })))}
      Tasks: ${JSON.stringify(data.tasks.filter(t => t.status !== 'Completed').map(t => ({ title: t.title, due: t.dueDate, priority: t.priority })))}
      Contacts (last contacted): ${JSON.stringify(data.contacts.map(c => ({ name: c.name, last: c.lastContacted, type: c.type })))}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No insights available today.";
  } catch (error) {
    console.error("Briefing Error:", error);
    return "Could not generate daily briefing.";
  }
};

/**
 * Generates a narrative summary of a deal room's status.
 */
export const getDealSummary = async (deal: Deal): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `Summarize the status of this real estate transaction for the agent in a professional, encouraging paragraph:
    Address: ${deal.property_address}
    Client: ${deal.clientName}
    Price: $${deal.price.toLocaleString()}
    Status: ${deal.status}
    Type: ${deal.type}
    Notes: ${deal.notes || 'No notes'}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Summary unavailable.";
  } catch (error) {
    console.error("Deal Summary Error:", error);
    return "Error generating summary.";
  }
};

/**
 * Deep analysis of verified property data.
 * Adheres to 4-point requirement: Ownership, Positioning, Risks, Score.
 */
export const performDeepPropertyAnalysis = async (lookup: PropertyLookupResult): Promise<Deal['ai_summary']> => {
    try {
      const ai = getAI();
      const prompt = `
        You are a specialized real estate data analyst at Nexus Intelligence.
        Analyze this VERIFIED public property data and provide:
        1. Ownership insights (patterns, duration, entity type)
        2. Market positioning (value potential, liquidity)
        3. Negotiation risks (age, zoning, historical flags)
        4. Investment opportunity score (0-100)

        Only use provided data. Do not guess or hallucinate details.
        Output ONLY a JSON object matching this schema:
        {
          "ownership_insights": "...",
          "market_positioning": "...",
          "negotiation_risks": "...",
          "investment_score": number,
          "raw_text": "full narrative summary"
        }

        VERIFIED DATA:
        Address: ${lookup.address}
        Type: ${lookup.property_type}
        Year Built: ${lookup.year_built}
        Last Sale: $${lookup.last_sale_price.toLocaleString()} on ${lookup.last_sale_date}
        Estimated Value: $${lookup.estimated_value.toLocaleString()}
        Confidence Score: ${lookup.confidence_score}
        Raw Context: ${JSON.stringify(lookup.raw_response)}
      `;
  
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ownership_insights: { type: Type.STRING },
              market_positioning: { type: Type.STRING },
              negotiation_risks: { type: Type.STRING },
              investment_score: { type: Type.NUMBER },
              raw_text: { type: Type.STRING }
            },
            required: ["ownership_insights", "market_positioning", "negotiation_risks", "investment_score", "raw_text"]
          }
        }
      });
  
      const result = JSON.parse(response.text || "{}");
      return result;
    } catch (error) {
      console.error("Deep Analysis Error:", error);
      throw error;
    }
};

/**
 * Generates follow-up drafts for a contact.
 */
export const generateFollowUp = async (contact: Contact): Promise<{ sms: string; email: string }> => {
  try {
    const ai = getAI();
    const prompt = `Generate a short SMS and a professional Email follow-up for this real estate lead:
    Name: ${contact.name}
    Type: ${contact.type}
    Notes: ${contact.notes || 'No specific notes'}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sms: { type: Type.STRING },
            email: { type: Type.STRING }
          },
          required: ["sms", "email"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Follow-up Error:", error);
    throw error;
  }
};

/**
 * Cleans and categorizes raw import data.
 */
export const cleanImportData = async (data: any[], type: string): Promise<{ cleaned: any[], issues: string[] }> => {
  try {
    const ai = getAI();
    const prompt = `Clean and standardize this list of ${type} for a real estate CRM. 
    Standardize names, formats, and flag any obvious duplicates or missing critical info.
    DATA: ${JSON.stringify(data)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cleaned: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, email: {type: Type.STRING}, phone: {type: Type.STRING}, type: {type: Type.STRING} } }
            },
            issues: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["cleaned", "issues"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Import Clean Error:", error);
    throw error;
  }
};

/**
 * Extracts property lead data from raw text blobs.
 */
export const extractPublicRecordData = async (text: string): Promise<any> => {
  try {
    const ai = getAI();
    const prompt = `Extract structured property lead data from this raw text:
    TEXT: ${text}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            full_name: { type: Type.STRING },
            address: { type: Type.STRING },
            city_state: { type: Type.STRING },
            zip: { type: Type.STRING },
            property_type: { type: Type.STRING },
            last_sale_date: { type: Type.STRING },
            bedrooms: { type: Type.NUMBER },
            owner_occupied: { type: Type.BOOLEAN },
            date_source: { type: Type.STRING }
          },
          required: ["full_name", "address"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Scrub Error:", error);
    throw error;
  }
};

/**
 * Analyzes CSV structure to map it to CRM fields.
 */
export const analyzeCsvMapping = async (headers: string[], sampleRows: any[]): Promise<{ file_type: string, field_mapping: Record<string, string | null> }> => {
  try {
    const ai = getAI();
    const prompt = `Analyze these CSV headers and sample data. 
    Identify the file type (ClosedDeals, ActiveDeals, Leads, Contacts) and map columns to CRM fields.
    Headers: ${JSON.stringify(headers)}
    Samples: ${JSON.stringify(sampleRows)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            file_type: { type: Type.STRING },
            field_mapping: {
              type: Type.OBJECT,
              properties: {
                owner_name: { type: Type.STRING, nullable: true },
                address: { type: Type.STRING, nullable: true },
                city: { type: Type.STRING, nullable: true },
                zip: { type: Type.STRING, nullable: true },
                property_type: { type: Type.STRING, nullable: true },
                bedrooms: { type: Type.STRING, nullable: true },
                sale_price: { type: Type.STRING, nullable: true }
              }
            }
          },
          required: ["file_type", "field_mapping"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Mapping Error:", error);
    throw error;
  }
};

/**
 * Generates a counter-offer email draft.
 */
export const generateCounterOffer = async (offer: Offer, deal?: Deal): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `Draft a polite but firm counter-offer email from a listing agent to a buyer's agent.
    Buyer: ${offer.clientName}
    Offered: $${offer.amount.toLocaleString()}
    Property: ${offer.propertyAddress || deal?.property_address}
    Listing Price: $${deal?.price.toLocaleString() || 'N/A'}
    Notes: ${offer.notes || 'Standard counter'}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Draft unavailable.";
  } catch (error) {
    console.error("Negotiator Error:", error);
    return "Error generating draft.";
  }
};

export const queryCRM = async (query: string, data: CrmData): Promise<string> => {
  try {
    const ai = getAI();
    
    const context = {
      systemTime: new Date().toISOString(),
      user: { name: data.user.displayName, role: data.user.role },
      deals: data.deals.map(d => ({ 
          id: d.id, 
          address: d.property_address, 
          client: d.clientName, 
          status: d.status, 
          price: d.price, 
          type: d.type,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt
      })),
      tasks: data.tasks.filter(t => t.status !== 'Completed').map(t => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
          due: t.dueDate,
          assignedTo: t.assignedToName,
          dealId: t.dealId
      })),
      offers: data.offers.map(o => ({
          property: o.propertyAddress,
          buyer: o.clientName,
          amount: o.amount,
          status: o.status,
          submitted: o.submittedDate
      })),
      contacts: data.contacts.map(c => ({ 
          name: c.name,
          type: c.type,
          lastContact: c.lastContacted,
          notes: c.notes
      }))
    };

    const prompt = `
      You are an AI assistant for a real estate agent at "Reality Mark". 
      You analyze deals, offers, contacts, and tasks to provide professional strategic advice.

      Answer questions like:
      - What deals are stuck? (e.g. Active for too long without movement)
      - Who should I follow up with? (e.g. Contacts not reached in 7+ days)
      - What is most likely to close soon? (e.g. Deals "Under Contract" or with "Accepted" offers)

      Always give:
      1. Clear, direct answer
      2. Supporting data from the CRM context provided below
      3. Suggested next best action for the agent

      SYSTEM DATA:
      ${JSON.stringify(context, null, 2)}
      
      USER QUESTION: "${query}"
      
      Instructions:
      - Keep the tone professional, encouraging, and firm.
      - If you don't have enough data, state what is missing.
      - Do not invent properties or clients.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: prompt,
    });
    return response.text || "I couldn't generate an answer based on your CRM data.";
  } catch (error) {
    console.error("Gemini Query Error:", error);
    return "Sorry, I encountered an error while analyzing your CRM data. Please try again.";
  }
};
