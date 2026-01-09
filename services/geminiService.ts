
import { GoogleGenAI, Type } from "@google/genai";
import { Update, CrmData, Deal, Offer, Contact, SmartImportRecord, PropertyLookupResult } from "../types";

const getAI = () => {
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : null;
  if (!apiKey) { 
    throw new Error("API Key is missing. Please check your configuration."); 
  }
  return new GoogleGenAI({ apiKey: apiKey });
};

export const getDailyBriefing = async (data: CrmData): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `You are a senior real estate operations manager. Based on the following data about deals, offers, tasks, and last contact dates, tell the agent the TOP 5 actions they should focus on today. DATA: Listings: ${JSON.stringify(data.listings)} Offers: ${JSON.stringify(data.offers)} Tasks: ${JSON.stringify(data.tasks)}`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || "No insights available today.";
  } catch (error) { 
    console.error("Briefing Error:", error);
    return "Could not generate daily briefing."; 
  }
};

export const performDeepPropertyAnalysis = async (lookup: PropertyLookupResult): Promise<Deal['ai_summary']> => {
    try {
      const ai = getAI();
      const prompt = `Analyze this property data: Address: ${lookup.address}, Value: ${lookup.estimated_value}. Provide 1. Ownership insights 2. Market positioning 3. Negotiation risks 4. Investment score (0-100). Return JSON.`;
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
      return JSON.parse(response.text || "{}");
    } catch (error) { 
      console.error("Deep Analysis Error:", error);
      throw error; 
    }
};

export const analyzeCsvMapping = async (headers: string[], sampleRows: any[]): Promise<{ file_type: string, field_mapping: Record<string, string | null> }> => {
  try {
    const ai = getAI();
    const prompt = `Analyze these CSV headers: ${JSON.stringify(headers)}. 
    Identify the record type: Listing, Offer, Contact, or Task. 
    Map columns to the following internal fields if they exist in the headers:
    owner_name, address, city, zip, contact_email, sale_price, mls_number, 
    zip4, carrier_route, prop_do_not_mail, owner_names, owner_last_name, owner_first_name...`;
    
    const response = await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview', 
      contents: prompt, 
      config: { 
        responseMimeType: "application/json", 
        responseSchema: { 
          type: Type.OBJECT, 
          properties: { 
            file_type: { type: Type.STRING, description: "Listing, Offer, Contact, or Task" }, 
            field_mapping: { 
              type: Type.OBJECT, 
              properties: { 
                mls_number: { type: Type.STRING, nullable: true },
                owner_name: { type: Type.STRING, nullable: true }, 
                address: { type: Type.STRING, nullable: true }, 
                sale_price: { type: Type.STRING, nullable: true }, 
                email: { type: Type.STRING, nullable: true }, 
                title: { type: Type.STRING, nullable: true }, 
                due_date: { type: Type.STRING, nullable: true },
                settlement_date: { type: Type.STRING, nullable: true },
                tax_id: { type: Type.STRING, nullable: true },
                school_district: { type: Type.STRING, nullable: true },
                annual_tax: { type: Type.STRING, nullable: true }
              },
              additionalProperties: { type: Type.STRING, nullable: true }
            } 
          }, 
          required: ["file_type", "field_mapping"] 
        } 
      } 
    });
    return JSON.parse(response.text || "{}");
  } catch (error) { 
    console.error("Mapping Analysis Error:", error);
    throw error; 
  }
};

export const generateCounterOffer = async (offer: Offer, deal?: Deal): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `Draft a firm counter-offer for ${offer.buyer_name} on ${offer.property_address}. Offered: $${offer.offer_price}. List Price: $${deal?.price || 'N/A'}.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || "Draft unavailable.";
  } catch (error) { 
    console.error("Counter Offer Error:", error);
    return "Error generating draft."; 
  }
};

export const queryCRM = async (query: string, data: CrmData): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `You are a real estate AI assistant. Answer this query based on CRM data: "${query}". Context: ${JSON.stringify(data)}`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || "I couldn't generate an answer.";
  } catch (error) { 
    console.error("CRM Query Error:", error);
    return "Error analyzing CRM data."; 
  }
};
