'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { TourCompany, CompanyConfig } from '@/lib/types';
import { usePathname } from 'next/navigation';
import { getCompanyBySlug, getGlobalSettings } from '@/lib/supabase/public-actions';

// ── localStorage helpers ──────────────────────────────────────────────
const STORAGE_KEYS = {
    COMPANY: 'current_company',
    CONFIG: 'current_company_config',
    GLOBAL_SETTINGS: 'global_settings',
    FORM_FIELDS: 'form_fields',
} as const;

function saveToStorage(key: string, value: any) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch { /* quota exceeded or SSR */ }
}

function loadFromStorage<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/**
 * Extracts the CompanyConfig from the Supabase company_app_config relation.
 * Handles both array (one-to-many) and object (one-to-one) responses from
 * Supabase's `select('*, company_app_config(*)')`.
 */
function extractConfig(companyData: any): CompanyConfig | null {
    const raw = companyData?.company_app_config;
    if (!raw) return null;

    // Supabase may return a single object if the FK is unique, or an array otherwise
    if (Array.isArray(raw)) {
        return raw[0] || null;
    }
    // Already a plain object
    if (typeof raw === 'object') {
        return raw as CompanyConfig;
    }
    return null;
}

// ── Context ───────────────────────────────────────────────────────────
interface CompanyContextType {
    company: TourCompany | null;
    config: CompanyConfig | null;
    globalSettings: any | null;
    formFields: any[];
    isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType>({
    company: null,
    config: null,
    globalSettings: null,
    formFields: [],
    isLoading: true,
});

export const useCompany = () => useContext(CompanyContext);

// ── Provider ──────────────────────────────────────────────────────────
export default function CompanyProvider({ 
    children,
    company: initialCompany,
    config: initialConfig
}: { 
    children: React.ReactNode;
    company?: TourCompany;
    config?: CompanyConfig | null;
}) {
    // Initialize with server-safe defaults (null/true) to avoid hydration
    // mismatch. localStorage is only available on the client.
    const [company, setCompany] = useState<TourCompany | null>(initialCompany || null);
    const [config, setConfig] = useState<CompanyConfig | null>(initialConfig || null);
    const [globalSettings, setGlobalSettings] = useState<any | null>(null);
    const [formFields, setFormFields] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const pathname = usePathname();
    const globalSettingsFetched = useRef(false);
    const hydratedFromStorage = useRef(false);

    // Persist company + config to localStorage whenever they change
    useEffect(() => {
        if (company) {
            saveToStorage(STORAGE_KEYS.COMPANY, company);
        }
    }, [company]);

    useEffect(() => {
        if (config) {
            saveToStorage(STORAGE_KEYS.CONFIG, config);
        }
    }, [config]);

    useEffect(() => {
        if (globalSettings) {
            saveToStorage(STORAGE_KEYS.GLOBAL_SETTINGS, globalSettings);
        }
    }, [globalSettings]);

    useEffect(() => {
        if (formFields && formFields.length > 0) {
            saveToStorage(STORAGE_KEYS.FORM_FIELDS, formFields);
        }
    }, [formFields]);

    // Main data-fetch effect (runs only on the client)
    useEffect(() => {
        let cancelled = false;

        const fetchContext = async () => {
            // ── Step 0: Hydrate from localStorage once (client-only) ──
            // This gives us immediate data on excluded pages (product/cart/checkout)
            // without waiting for the async server-action round-trip.
            let currentCompany = company;
            let currentConfig = config;

            if (!hydratedFromStorage.current) {
                hydratedFromStorage.current = true;

                const storedGlobalSettings = loadFromStorage(STORAGE_KEYS.GLOBAL_SETTINGS);
                if (storedGlobalSettings && !globalSettings) {
                    setGlobalSettings(storedGlobalSettings);
                }

                if (!currentCompany) {
                    const stored = loadFromStorage<TourCompany>(STORAGE_KEYS.COMPANY);
                    if (stored) {
                        currentCompany = stored;
                        setCompany(stored);
                    }
                }
                if (!currentConfig) {
                    const stored = loadFromStorage<CompanyConfig>(STORAGE_KEYS.CONFIG);
                    if (stored) {
                        currentConfig = stored;
                        setConfig(stored);
                    }
                }
                
                const storedFields = loadFromStorage<any[]>(STORAGE_KEYS.FORM_FIELDS);
                if (storedFields) {
                    setFormFields(storedFields);
                }
            }

            // ── Step 1: Fetch global settings (once per session) ──
            if (!globalSettingsFetched.current) {
                const gRes = await getGlobalSettings();
                if (!cancelled && gRes.success) {
                    setGlobalSettings(gRes.settings);
                    globalSettingsFetched.current = true;
                }
            }

            // ── Step 2: Determine which company slug to load ──
            const segments = pathname.split('/').filter(Boolean);
            const firstSegment = segments[0];
            const isExcluded = !firstSegment || 
                ['admin', 'company', 'cart', 'checkout', 'success', 'product'].includes(firstSegment);

            const targetSlug = isExcluded
                ? currentCompany?.slug ?? null
                : firstSegment;

            // Nothing to load
            if (!targetSlug) {
                if (!cancelled) setIsLoading(false);
                return;
            }

            // ── Step 3: Fetch company + config from server ──
            // We always fetch to ensure we have the latest form fields and config,
            // even if we hydrated from storage (stale-while-revalidate).
            if (!cancelled) setIsLoading(!currentCompany); // Only show loading if we have nothing at all
            const res = await getCompanyBySlug(targetSlug);

            if (cancelled) return;

            if (res.success && res.company) {
                console.log(`[CompanyProvider] Successfully fetched context for ${targetSlug}. Fields: ${res.formFields?.length}`);
                setCompany(res.company);
                setConfig(extractConfig(res.company));
                if (res.formFields) {
                    setFormFields(res.formFields);
                }
            } else {
                if (res.error === 'Company not found') {
                    console.warn(`[CompanyProvider] Company not found for slug: ${targetSlug}`);
                } else {
                    console.error(`[CompanyProvider] Failed to fetch context for ${targetSlug}:`, res.error);
                }
                // Clear stale/invalid company data to fallback to default brand settings
                setCompany(null);
                setConfig(null);
                setFormFields([]);
                try {
                    localStorage.removeItem(STORAGE_KEYS.COMPANY);
                    localStorage.removeItem(STORAGE_KEYS.CONFIG);
                    localStorage.removeItem(STORAGE_KEYS.FORM_FIELDS);
                } catch {}
            }
            setIsLoading(false);
        };

        fetchContext();

        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    return (
        <CompanyContext.Provider value={{ company, config, globalSettings, formFields, isLoading }}>
            {children}
        </CompanyContext.Provider>
    );
}
