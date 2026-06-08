// Single source of truth for known infrastructure components.
// Add a new component here ONCE and every part of Forge picks it up.

export const KNOWN_COMPONENTS = [
    { name: "db-pooler", regex: /db[-_]pooler/gi },
    { name: "auth-service", regex: /auth[-_]service/gi },
    { name: "api-gateway", regex: /api[-_]gateway/gi },
    { name: "postgres", regex: /postgres/gi },
    { name: "redis", regex: /redis/gi },
    { name: "kafka", regex: /kafka/gi },
    { name: "nginx", regex: /nginx/gi },
    { name: "k8s-monitor", regex: /k8s[-_]monitor/gi },
    { name: "payment-service", regex: /payment[-_]service/gi },
    { name: "user-service", regex: /user[-_]service/gi },
    { name: "notification-service", regex: /notification[-_]service/gi },
    { name: "order-service", regex: /order[-_]service/gi },
    { name: "inventory-service", regex: /inventory[-_]service/gi },
];

// Find every known component mentioned in a block of text.
// Returns a Set of normalized names.
export function findComponentsInText(text) {
    const found = new Set();
    if (!text) return found;

    for (const component of KNOWN_COMPONENTS) {
        // Reset regex lastIndex since /g regexes are stateful
        component.regex.lastIndex = 0;
        if (component.regex.test(text)) {
            found.add(component.name);
        }
    }
    return found;
}

// Detect the single most-mentioned component in text.
export function detectPrimaryComponent(text) {
    if (!text) return null;

    let topComponent = null;
    let topCount = 0;

    for (const component of KNOWN_COMPONENTS) {
        component.regex.lastIndex = 0;
        const matches = text.match(component.regex);
        const count = matches ? matches.length : 0;
        if (count > topCount) {
            topCount = count;
            topComponent = component.name;
        }
    }
    return topComponent;
}