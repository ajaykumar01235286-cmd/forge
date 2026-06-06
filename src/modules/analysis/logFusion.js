export function fuseLogs(evidenceRecords){
    const allLines = [];
    for (const record of evidenceRecords) {
        if (!record.extractedData) continue;
        const sourceName = record.sourceFile || "unknown-source";
        const lines = record.extractedData.split("\n");
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
           const timestamp = extractTimestamp(trimmed);
            allLines.push({source: sourceName,
                timestamp,
                raw: trimmed,
                sortkey: timestamp ? new Date(timestamp).getTime() : Infinity
            });

        }

    }
    allLines.sort((a,b) => a.sortkey - b.sortkey );
    const seen = new Set();
    const deduplicated = allLines.filter(line => {
        const key = line.raw.toLowerCase().replace(/\s+/g, "");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    const fused = deduplicated
    .map(line => `[${line.source}] ${line.timestamp ?? "no-timestamp"} | ${line.raw}`)
    .join("\n");

     return {
        fused,
        lineCount: deduplicated.length,
        sourceCount: new Set(evidenceRecords.map(r => r.sourceFile)).size
    };
}
function extractTimestamp(line) {
    
    const iso = line.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?/);
    if (iso) return iso[0];

    
    const common = line.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    if (common) return common[0];

   
    const apache = line.match(/\d{2}\/\w{3}\/\d{4}:\d{2}:\d{2}:\d{2}/);
    if (apache) return apache[0];

    return null;
}