import fs from "fs/promises";
export async function extractEvidence(filePath){
    const content = await fs.readFile(filePath,"utf8");
const lines = content.split("\n");
const errors = [];
const warning = [];
let firstErrorTime = null; 
for (const line of lines){
    if (line.includes("ERROR")){
        errors.push(line);
        if (!firstErrorTime){
            const timestamp = line.split(" ")[0];
            firstErrorTime = timestamp;
        }
    }
    if (line.includes("WARN")){
        warning.push(line);
    }
}
return{
    errorCount: errors.length,
    warningCount: warning.length,
    firstErrorTime,
    errors,
    warning
};
}