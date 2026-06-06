
import { eq } from "drizzle-orm";
import { evidence } from "../../db/schema.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fuseLogs } from "./logFusion.js";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
export async function analyzeEvidence(db, incidentId) {
    const records = await db.select()
        .from(evidence)
        .where(eq(evidence.incidentId, incidentId));

    if (!records.length) 
        return null;
    const { fused, lineCount, sourceCount } = fuseLogs(records);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });
    const telementryPayload = records.map(r => r.extractedData);

  
    const prompt = `
       You are the Forge Master Diagnostic Agent, an elite AI system designed to analyze highly complex, distributed system failures. You operate with the rigor of a Principal Systems Architect.

Your mandate is to ingest system telemetry, perform a deterministic Root Cause Analysis (RCA), and output structured intelligence. You must absolutely NOT hallucinate or guess.
TELEMETRY METADATA:
- Sources fused: ${sourceCount} log file(s)
- Total lines analyzed: ${lineCount}
- Format: [source-file] timestamp | log line


EXECUTION PROTOCOL:
1. TOPOLOGY MAPPING: Identify the components involved in the payload (e.g., API Gateway -> Auth Service -> Postgres).
2. CHAIN OF THOUGHT: You must explicitly write out your step-by-step logical deduction in the "diagnosticReasoning" array BEFORE declaring a root cause.
3. FALSIFICATION: For every hypothesis you make, you must attempt to disprove it using the available evidence.
4. EVIDENCE BINDING: Every final claim MUST cite the exact log line, timestamp, or trace ID.

Return EXACTLY this JSON structure. Do not include markdown formatting like \`\`\`json.

{
"timeline": [
    { "time": "...", "event": "..." }
  ],
  "diagnosticReasoning": [
    {
      "step": 1,
      "focus": "Identifying the initial anomaly",
      "observation": "What the raw data shows at the start of the incident",
      "deduction": "What this implies technically"
    },
    {
      "step": 2,
      "focus": "Tracing the cascade",
      "observation": "How the initial anomaly impacted downstream systems",
      "deduction": "The mechanism of failure (e.g., resource exhaustion, network partition)"
    },
    {
      "step": 3,
      "focus": "Falsification check",
      "observation": "Testing the most obvious hypothesis",
      "deduction": "Why the obvious answer might be wrong based on the logs"
    }
  ],
  "incidentFingerprint": {
    "executiveSummary": "A highly technical, 2-sentence summary of the definitive failure state.",
    "primaryFailingComponent": "The exact microservice, database, or network layer that broke first.",
    "severityLevel": "SEV-1 | SEV-2 | SEV-3"
  },
  "rootCauseAnalysis": {
    "definitiveRootCause": "The absolute lowest-level technical trigger.",
    "evidenceCitations": [
      "EXACT copy-pasted string/trace ID from the logs that proves the root cause beyond a shadow of a doubt."
    ]
  },
  "actionableRunbook": {
    "mitigationSteps": [
      {
        "action": "Precise description of the fix",
        "cliCommand": "Copy-pasteable CLI command (kubectl, psql, aws, etc.) if applicable",
        "riskAssessment": "What could break if an engineer runs this command?"
      }
    ]
  },
  "confidenceMatrix": {
    "overallScore": 0,
    "missingTelemetry": [
      "Specifically what Datadog/Splunk/Prometheus metrics or logs are missing from this payload that would increase confidence to 100%"
    ]
  }
}

FUSED TELEMETRY TIMELINE (${sourceCount} source(s), ${lineCount} lines):
${fused}    `;

  
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
}