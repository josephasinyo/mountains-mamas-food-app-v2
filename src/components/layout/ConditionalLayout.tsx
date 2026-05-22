'use client';

import { usePathname } from 'next/navigation';
import { CartProvider } from '@/hooks/useCart';
import Header from '@/components/layout/Header';
import CompanyProvider from '@/components/context/CompanyProvider';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith('/admin');
    const isCompanyDashRoute = pathname?.startsWith('/company');
    const isOnboardRoute = pathname?.startsWith('/onboard');

    const isPublicMealRoute = pathname?.startsWith('/public-meal');

    // Admin, company dashboard, onboarding, public meal showcase, and root pages get a clean layout (no cart/header)
    if (isAdminRoute || isCompanyDashRoute || isOnboardRoute || pathname === '/' || isPublicMealRoute) {
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
