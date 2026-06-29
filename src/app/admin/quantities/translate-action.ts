'use server';

import translate from 'google-translate-api-x';

/**
 * Translates an array of English food customization notes to Spanish
 * using the free Google Translate API (google-translate-api-x).
 *
 * Texts are translated sequentially to avoid query-rate triggers.
 * Successfully translated texts are cached in a module-level Map for the
 * lifetime of the server process.
 * Returns a mapping of { englishText: spanishTranslation }.
 */

// ─── Server-side Translation Cache ───────────────────────────────────────────
const translationCache = new Map<string, string>();

async function translateSingleText(text: string): Promise<string> {
    try {
        const res = await translate(text, { from: 'en', to: 'es' });
        let translatedText = res?.text?.trim() || text;
        
        if (translatedText) {
            // Capitalize the first letter
            translatedText = translatedText.charAt(0).toUpperCase() + translatedText.slice(1);
        }
        
        // Only cache if translation was successful and returned a different text
        if (translatedText && translatedText !== text) {
            translationCache.set(text, translatedText);
        }
        return translatedText;
    } catch (error) {
        console.error(`[translateCustomizations] Google Translate error for "${text}":`, error);
        // Capitalize fallback text too
        const capitalizedFallback = text.charAt(0).toUpperCase() + text.slice(1);
        return capitalizedFallback;
    }
}

export async function translateCustomizations(
    texts: string[]
): Promise<Record<string, string>> {
    // Normalize newlines and deduplicate
    const unique = [...new Set(texts.filter(t => t && t.trim()).map(t => t.replace(/\r\n/g, '\n').trim()))];
    if (unique.length === 0) return {};

    const result: Record<string, string> = {};
    const uncached: string[] = [];

    // ─── Step 1: Serve from cache where possible ─────────────────────────────
    for (const text of unique) {
        const cached = translationCache.get(text);
        if (cached) {
            result[text] = cached;
        } else {
            uncached.push(text);
        }
    }

    if (uncached.length === 0) {
        console.log(`[translateCustomizations] ✅ All ${unique.length} texts served from cache — no Google Translate call needed`);
        return result;
    }

    console.log(`[translateCustomizations] Cache hit: ${unique.length - uncached.length} | Translating via Google: ${uncached.length} | Cache size: ${translationCache.size}`);

    // ─── Step 2: Translate uncached texts sequentially to prevent rate limits ───
    for (const text of uncached) {
        const translated = await translateSingleText(text);
        result[text] = translated;
        // Small 100ms pause between requests to be polite
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`[translateCustomizations] Finished translation batch. New Cache size: ${translationCache.size}`);
    return result;
}


/**
 * Fetches Spanish meal/cookie names from the database.
 * Returns a mapping of { englishName: spanishName }.
 */
export async function getMealTranslations(): Promise<Record<string, string>> {
    try {
        const { createAdminClient } = await import('@/lib/supabase/server');
        const supabase = createAdminClient();

        const { data: meals, error } = await supabase
            .from('meals')
            .select('name, name_es')
            .not('name_es', 'is', null);

        if (error) throw error;

        const translations: Record<string, string> = {};
        for (const meal of (meals || [])) {
            if (meal.name_es) {
                translations[meal.name] = meal.name_es;
            }
        }

        return translations;
    } catch (error) {
        console.error('[getMealTranslations] Error:', error);
        return {};
    }
}
