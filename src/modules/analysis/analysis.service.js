
import { eq } from "drizzle-orm";
import { evidence } from "../../db/schema.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
export async function analyzeEvidence(db, incidentId) {
    const records = await db.select()
        .from(evidence)
        .where(eq(evidence.incidentId, incidentId));

    if (!records.length) {
        return null;
    }

    const extractedData = records[0].extractedData; 
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

  
    const prompt = `
        You are an incident analysis AI. Based on the following system evidence, identify possible root causes.
        Evidence: ${JSON.stringify(extractedData)}
        
        You must respond with a strict JSON object containing EXACTLY these keys:
        - "rootCause" (string)
        - "confidenceScore" (number between 0 and 1)
        - "hypotheses" (array of strings)
    `;

  
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
}