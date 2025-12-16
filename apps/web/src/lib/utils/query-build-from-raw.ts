export function queryBuildFromRaw(query: string): string {
    if (!query) return "";

    const parts: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < query.length; i++) {
        const ch = query[i];

        if (ch === '"') {
            if (!inQuotes) {
                // starting a quoted segment
                if (current.trim()) {
                    // flush any word before the quote
                    current
                        .trim()
                        .split(/\s+/)
                        .forEach((w) => {
                            if (w.length > 0) parts.push(`"${w}"`);
                        });
                }
                current = '"';
                inQuotes = true;
            } else {
                // ending a quoted segment
                current += '"';
                if (current.trim().length > 0) {
                    parts.push(current.trim());
                }
                current = "";
                inQuotes = false;
            }
        } else if (/\s/.test(ch) && !inQuotes) {
            // whitespace outside quotes -> word boundary
            if (current.trim()) {
                current
                    .trim()
                    .split(/\s+/)
                    .forEach((w) => {
                        if (w.length > 0) parts.push(`"${w}"`);
                    });
                current = "";
            }
        } else {
            current += ch;
        }
    }

    // flush remaining buffer
    if (current.trim()) {
        if (inQuotes) {
            // unterminated quote, keep as\-is
            parts.push(current.trim());
        } else {
            current
                .trim()
                .split(/\s+/)
                .forEach((w) => {
                    if (w.length > 0) parts.push(`"${w}"`);
                });
        }
    }

    return parts.join(" ");
}
