import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDriveDirectLink(url: string | undefined): string | undefined {
    if (!url) return undefined;

    // Extract ID from: https://drive.google.com/file/d/ID/view...
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
    }

    // Or handle direct ID provided?
    return url;
}

/**
 * Finds the most likely match for a given input from a list of strings
 */
export function findBestMatch(input: string, list: string[]): string {
    if (!input || !list || list.length === 0) return input;
    
    const normalizedInput = input.trim().toLowerCase();
    
    // 1. Precise match (case-insensitive)
    const exactMatch = list.find(item => item.toLowerCase() === normalizedInput);
    if (exactMatch) return exactMatch;

    // 2. Starts with / Includes match
    const startsWith = list.find(item => item.toLowerCase().startsWith(normalizedInput));
    if (startsWith) return startsWith;

    const includes = list.find(item => item.toLowerCase().includes(normalizedInput));
    if (includes) return includes;

    // 3. Simple character overlap similarity
    let bestScore = 0;
    let bestMatch = input;

    list.forEach(item => {
        const score = calculateSimilarity(normalizedInput, item.toLowerCase());
        if (score > bestScore) {
            bestScore = score;
            bestMatch = item;
        }
    });

    // Only return the best match if it's reasonably similar (score > 0.4)
    return bestScore > 0.4 ? bestMatch : input;
}

function calculateSimilarity(s1: string, s2: string): number {
    const set1 = new Set(s1.split(''));
    const set2 = new Set(s2.split(''));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
}

/**
 * Formats a date string or Date object into US format (MM/DD/YYYY)
 * Handles YYYY-MM-DD string inputs carefully to avoid timezone shifts.
 */
export function formatDateUS(date: string | Date | undefined | null): string {
    if (!date) return '';
    
    // Handle YYYY-MM-DD specifically to avoid timezone conversion issues
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-');
        return `${month}/${day}/${year}`;
    }
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return typeof date === 'string' ? date : '';
    
    return d.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });
}

/**
 * Formats a date string or Date object into US date/time format (MM/DD/YYYY HH:MM AM/PM)
 */
export function formatDateTimeUS(date: string | Date | undefined | null): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    
    return d.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    }) + ' ' + d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Safe print helper compatible with iOS AirPrint (iPad / iPhone) and desktop browsers.
 * Keeps print CSS classes active while non-blocking Mobile WebKit print triggers.
 */
export function safePrint(modeClass?: string, delayMs = 3000) {
    if (modeClass) {
        document.body.classList.add(modeClass);
    }

    let cleaned = false;
    const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        if (modeClass) {
            document.body.classList.remove(modeClass);
        }
        window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup, { once: true });

    // Trigger browser native print dialog (or iOS AirPrint)
    window.print();

    // Fallback cleanup for asynchronous/non-blocking webkit engines (iPadOS Safari)
    setTimeout(cleanup, delayMs);
}

/**
 * Finds the best matching Gluten-Free cookie/treat option from a list of available cookie options.
 * Prioritizes Gluten-Free Brownie, then any Gluten-Free option, then any Brownie.
 */
export function findGfCookieOption(cookieOptions: string[]): string | undefined {
    if (!cookieOptions || cookieOptions.length === 0) return undefined;
    
    // 1. Prefer option that specifies BOTH gluten-free AND brownie
    const gfBrownie = cookieOptions.find((c: string) => {
        const lower = c.toLowerCase();
        return (lower.includes('gluten') || lower.includes('gf')) && lower.includes('brownie');
    });
    if (gfBrownie) return gfBrownie;

    // 2. Next, prefer any option that specifies gluten-free / gf
    const gfAny = cookieOptions.find((c: string) => {
        const lower = c.toLowerCase();
        return lower.includes('gluten') || lower.includes('gf');
    });
    if (gfAny) return gfAny;

    // 3. Fallback to brownie option
    const brownieAny = cookieOptions.find((c: string) => c.toLowerCase().includes('brownie'));
    if (brownieAny) return brownieAny;

    return undefined;
}
