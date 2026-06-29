'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { CartProvider } from '@/hooks/useCart';
import Header from '@/components/layout/Header';
import CompanyProvider from '@/components/context/CompanyProvider';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith('/admin');
    const isCompanyDashRoute = pathname?.startsWith('/company');
    const isOnboardRoute = pathname?.startsWith('/onboard');

    const isPublicMealRoute = pathname?.startsWith('/public-meal');
    const isInvoiceRoute = pathname?.startsWith('/invoice');

    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash) {
            const hash = window.location.hash;
            if (hash.includes('access_token=') && hash.includes('type=recovery')) {
                const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );
                
                // Parse hash, establish session and fetch user role
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session?.user) {
                        const role = session.user.user_metadata?.role;
                        const isCompany = !role || (role !== 'admin' && role !== 'staff');
                        if (isCompany) {
                            window.location.href = '/company/reset-password' + hash;
                        } else {
                            window.location.href = '/admin/reset-password' + hash;
                        }
                    } else {
                        // Fallback to admin reset-password
                        window.location.href = '/admin/reset-password' + hash;
                    }
                });
            }
        }
    }, []);

    // Admin, company dashboard, onboarding, public meal showcase, invoice pages, and root pages get a clean layout (no cart/header)
    if (isAdminRoute || isCompanyDashRoute || isOnboardRoute || pathname === '/' || isPublicMealRoute || isInvoiceRoute) {
        return <>{children}</>;
    }

    // Everything else gets the regular ordering app layout
    return (
        <CompanyProvider>
            <CartProvider>
                <main>
                    <Header />
                    {children}
                </main>
            </CartProvider>
        </CompanyProvider>
    );
}
