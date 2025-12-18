export default function getInitials(name: string) {
    if (!name) return '';

    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';

    if (words.length === 1) {
        const w = words[0];
        if (w.length === 1) return (w + w).toUpperCase();
        return w.slice(0, 2).toUpperCase();
    }

    return (words[0][0] + words[1][0]).toUpperCase();
}