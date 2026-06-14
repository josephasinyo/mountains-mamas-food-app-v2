'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    LayoutDashboard, ShoppingCart, UtensilsCrossed,
    Settings, LogOut, Mountain, PanelLeftClose, PanelLeft,
    Clock, ExternalLink, Eye, ArrowLeft,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { getImpersonationStatus, exitImpersonating } from './actions';

const navSections = [
    {
        label: 'Overview',
        items: [
            { title: 'Dashboard', href: '/company', icon: LayoutDashboard },
            { title: 'Orders', href: '/company/orders', icon: ShoppingCart },
        ],
    },
    {
        label: 'App Configuration',
        items: [
            { title: 'Menu Management', href: '/company/menu', icon: UtensilsCrossed },
            { title: 'App Settings', href: '/company/settings', icon: Settings },
        ],
    },
];

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [companyInfo, setCompanyInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [impersonation, setImpersonation] = useState<{
        isImpersonating: boolean;
        companyName?: string;
        companyId?: string;
    }>({ isImpersonating: false });
    const [isMobile, setIsMobile] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        async function getSession() {
            const { data: { session } } = await supabase.auth.getSession();
            const publicRoutes = ['/company/login', '/company/register', '/company/forgot-password'];
            if (!session) {
                if (!publicRoutes.includes(pathname)) {
                    router.push('/company/login');
                }
                setLoading(false);
                return;
            }

            setUser(session.user);
            
            // Get company info
            let companyId = session.user.user_metadata?.company_id;
            let companyName = session.user.user_metadata?.company_name || 'My Company';
            let companySlug = session.user.user_metadata?.company_slug;

            // Admin bypass
            if (!companyId && (session.user.user_metadata?.role?.toLowerCase() === 'admin' || session.user.email?.toLowerCase() === 'mountainmamascafe@gmail.com')) {
                const { data: companies } = await supabase.from('tour_companies').select('id, name, slug').limit(1);
                if (companies && companies.length > 0) {
                    companyId = companies[0].id;
                    companyName = companies[0].name;
                    companySlug = companies[0].slug;
                }
            }

            // Check impersonation status
            const impStatus = await getImpersonationStatus();
            setImpersonation(impStatus);
            if (impStatus.isImpersonating && impStatus.companyId) {
                const { data: company } = await supabase
                    .from('tour_companies')
                    .select('id, name, slug')
                    .eq('id', impStatus.companyId)
                    .single();
                if (company) {
                    companyId = company.id;
                    companyName = company.name;
                    companySlug = company.slug;
                }
            }

            setCompanyInfo({
                id: companyId,
                name: companyName,
                slug: companySlug
            });

            setLoading(false);
        }
        getSession();
    }, [pathname, router, supabase.auth]);

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) {
                setCollapsed(true);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close mobile sidebar on navigation
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/company/login');
    };

    const handleExitImpersonation = async () => {
        const toastId = toast.loading('Returning to Administrative dashboard...');
        try {
            const result = await exitImpersonating();
            if (result.success) {
                toast.success('Returned successfully!', { id: toastId });
                router.push('/admin/companies');
            } else {
                toast.error(result.error || 'Failed to exit impersonation mode', { id: toastId });
            }
        } catch (error) {
            console.error('Exit impersonation error:', error);
            toast.error('A network error occurred.', { id: toastId });
        }
    };

    // Public guest pages — standalone, no sidebar
    const publicRoutes = ['/company/login', '/company/register', '/company/forgot-password'];
    if (publicRoutes.includes(pathname)) {
        return (
            <div className="min-h-screen bg-background">
                {children}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#fafafa]">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 rounded-2xl bg-violet-600 flex items-center justify-center animate-pulse">
                        <Mountain className="size-6 text-white" />
                    </div>
                    <p className="text-sm font-bold text-gray-500 animate-pulse uppercase tracking-widest">Loading Portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#fafafa] overflow-x-hidden">
            {/* Impersonation Banner */}
            {impersonation.isImpersonating && (
                <div className="w-full h-10 bg-violet-600 text-white px-8 flex items-center justify-between text-[11px] font-black uppercase tracking-wider shadow-md z-50 sticky top-0 border-b border-violet-700">
                    <div className="flex items-center gap-2">
                        <Eye className="size-4 animate-pulse text-violet-200" />
                        <span>Viewing Portal as <span className="underline decoration-violet-300 decoration-2 underline-offset-2">{impersonation.companyName}</span></span>
                        <span className="bg-violet-700 text-[9px] px-2 py-0.5 rounded-full font-bold text-violet-200 ml-2 animate-pulse">Admin Mode</span>
                    </div>
                    <button
                        onClick={handleExitImpersonation}
                        className="flex items-center gap-1.5 bg-white text-violet-700 hover:bg-violet-50 px-3.5 py-1.5 rounded-xl transition-all shadow-sm hover:scale-105 active:scale-95 text-[10px] font-black"
                    >
                        <ArrowLeft className="size-3.5" /> Return to Admin
                    </button>
                </div>
            )}

            <div className="flex flex-1">
                {/* Mobile Backdrop */}
                <AnimatePresence>
                    {isMobile && mobileOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
                            style={{ top: impersonation.isImpersonating ? '40px' : '0px' }}
                        />
                    )}
                </AnimatePresence>

                {/* Sidebar */}
                <motion.aside 
                    initial={false}
                    animate={isMobile ? { x: mobileOpen ? 0 : -280, width: 260 } : { width: collapsed ? 70 : 260, x: 0 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                    className={cn(
                        "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-white shadow-[1px_0_0_0_rgba(0,0,0,0.05)]",
                        impersonation.isImpersonating ? "top-10" : "top-0",
                        isMobile && "shadow-2xl"
                    )}
                >
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 text-white shadow-lg shadow-violet-200 flex-shrink-0">
                        <Mountain className="size-[18px]" />
                    </div>
                    <AnimatePresence mode="wait">
                        {(!collapsed || isMobile) && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex flex-col leading-tight min-w-0"
                            >
                                <span className="font-bold text-[14px] text-gray-900 truncate tracking-tight">Mountain Mama&apos;s Café</span>
                                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Company Portal</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Nav */}
                <ScrollArea className="flex-1 py-4">
                    <nav className="space-y-6 px-3">
                        {navSections.map((section) => (
                            <div key={section.label}>
                                <AnimatePresence>
                                    {(!collapsed || isMobile) && (
                                        <motion.p 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="px-4 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400"
                                        >
                                            {section.label}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                                <div className="space-y-1">
                                    {section.items.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={cn(
                                                    "group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-200",
                                                    isActive
                                                        ? "bg-violet-50 text-violet-700"
                                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                                )}
                                                title={(collapsed && !isMobile) ? item.title : undefined}
                                            >
                                                {isActive && (
                                                    <motion.div 
                                                        layoutId="active-nav"
                                                        className="absolute inset-0 bg-violet-50 rounded-xl -z-10 border border-violet-100"
                                                    />
                                                )}
                                                <item.icon className={cn(
                                                    "flex-shrink-0 transition-colors",
                                                    (collapsed && !isMobile) ? "size-5" : "size-[18px]",
                                                    isActive ? "text-violet-600" : "text-gray-400 group-hover:text-gray-600"
                                                )} />
                                                <AnimatePresence>
                                                    {(!collapsed || isMobile) && (
                                                        <motion.span
                                                            initial={{ opacity: 0, x: -5 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -5 }}
                                                        >
                                                            {item.title}
                                                        </motion.span>
                                                    )}
                                                </AnimatePresence>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </ScrollArea>

                {/* Preview Link */}
                {(!collapsed || isMobile) && companyInfo?.slug && (
                    <div className="px-3 mb-2">
                        <Link 
                            href={`/${companyInfo.slug}`}
                            target="_blank"
                            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-900 text-white text-[12px] font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                        >
                            <ExternalLink className="size-4" />
                            <span>Open My Order App</span>
                        </Link>
                    </div>
                )}

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={handleSignOut}
                        className={cn(
                            "flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-bold text-gray-500 hover:text-red-600 hover:bg-red-50/50 transition-all w-full",
                            (collapsed && !isMobile) && "justify-center px-0"
                        )}
                    >
                        <LogOut className={cn("flex-shrink-0", (collapsed && !isMobile) ? "size-5" : "size-[18px]")} />
                        {(!collapsed || isMobile) && <span>Sign Out</span>}
                    </button>
                </div>
                </motion.aside>

                {/* Main area */}
                <motion.div 
                    animate={isMobile ? { marginLeft: 0 } : { marginLeft: collapsed ? 70 : 260 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                    className="flex-1 flex flex-col min-w-0"
                >
                    {/* Top bar */}
                    <header className={cn(
                        "sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-100 bg-white/80 backdrop-blur-xl px-4 sm:px-8",
                        impersonation.isImpersonating && "top-10"
                    )}>
                        <button
                            onClick={() => isMobile ? setMobileOpen(!mobileOpen) : setCollapsed(!collapsed)}
                            className="flex items-center justify-center size-9 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
                        >
                            {isMobile ? (
                                <PanelLeft className="size-[18px]" />
                            ) : (
                                collapsed ? <PanelLeft className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />
                            )}
                        </button>
                        
                        <div className="h-6 w-px bg-gray-200" />

                        {/* Breadcrumb area */}
                        <div className="flex-1 min-w-0">
                            <motion.span 
                                key={pathname}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-[14px] sm:text-[15px] font-bold text-gray-900 tracking-tight block truncate"
                            >
                                {navSections.flatMap(s => s.items).find(i => i.href === pathname)?.title || 'Dashboard'}
                            </motion.span>
                        </div>

                        {/* User */}
                        <div className="flex items-center gap-4 pl-4 border-l border-gray-100">
                            <div className="flex flex-col items-end leading-tight hidden sm:flex">
                                <span className="text-[13px] font-bold text-gray-900 truncate max-w-[150px]">{companyInfo?.name}</span>
                                <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">Tour Partner</span>
                            </div>
                            <div className="relative group cursor-pointer">
                                <div className="size-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-violet-200 ring-4 ring-white transition-transform group-hover:scale-105">
                                    {companyInfo?.name?.charAt(0) || 'C'}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-emerald-500 border-[3px] border-white shadow-sm" />
                            </div>
                        </div>
                    </header>

                    {/* Page content */}
                    <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
                        <div className="max-w-[1600px] mx-auto">
                            {children}
                        </div>
                    </main>
                </motion.div>
            </div>
        </div>
    );
}
