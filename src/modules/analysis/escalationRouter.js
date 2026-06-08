// Turns a confidence score into a routing decision.
// Pure function — no side effects, easy to test and reason about.

export function decideEscalation(aiPayload) {
    const score = aiPayload?.confidenceMatrix?.overallScore ?? 0;
    const missingTelemetry = aiPayload?.confidenceMatrix?.missingTelemetry ?? [];

    if (score >= 85) {
        return {
            tier: "auto-resolve",
            score,
            action: "notify",
            reason: `High confidence (${score}). RCA is trustworthy enough to auto-notify and close the loop.`,
            requiresHuman: false
        };
    }

    if (score >= 60) {
        return {
            tier: "human-review",
            score,
            action: "flag",
            reason: `Medium confidence (${score}). Flagged for human review before acting.`,
            requiresHuman: true
        };
    }

    return {
        tier: "request-telemetry",
        score,
        action: "request-data",
        reason: `Low confidence (${score}). More telemetry needed before a reliable RCA.`,
        requiresHuman: true,
        missingTelemetry
    };
}