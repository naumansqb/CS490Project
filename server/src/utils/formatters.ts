export const normalizeUrl = (url: string | undefined | null): string | undefined => {
    if (!url || !url.trim()) return undefined;
    const trimmed = url.trim();
    if (trimmed.match(/^https?:\/\//i)) {
        return trimmed;
    }
    return 'https://' + trimmed;
};

export const normalizeDate = (date: string | Date | undefined | null): string | undefined => {
    if (date instanceof Date) {
        return isNaN(date.getTime()) ? undefined : date.toISOString();
    }
    
    if (!date || typeof date !== 'string' || !date.trim()) return undefined;
    const trimmed = date.trim();
    
    if (trimmed.includes('T')) {
        const parsed = new Date(trimmed);
        return isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    }
    
    if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const parsed = new Date(trimmed + 'T00:00:00.000Z');
        return isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
    }
    
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

export const normalizeRelationshipStrength = (
    strength: number | string | null | undefined,
    defaultIfNull: number = 50
): number => {
    if (strength === null || strength === undefined || strength === '') {
        return defaultIfNull;
    }

    const numValue = typeof strength === 'number' 
        ? strength 
        : parseInt(String(strength));
    
    if (isNaN(numValue)) {
        return defaultIfNull;
    }
    
    return Math.max(0, Math.min(100, numValue));
};

