'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    LayoutDashboard, ShoppingCart, ClipboardList, UtensilsCrossed,
    Building2, FileText, ScrollText, BarChart3, Activity,
    LogOut, Ticket, Mountain, PanelLeftClose, PanelLeft, Settings, UserCog
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

const ALL_NAV_SECTIONS = [
    {
        label: 'Overview',
        items: [
            { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        ],
    },
    {
        label: 'Operations',
        items: [
            { title: 'Orders', href: '/admin/orders', icon: ShoppingCart },
            { title: 'Quantities', href: '/admin/quantities', icon: ClipboardList },
            { title: 'Invoices', href: '/admin/invoices', icon: ScrollText },
        ],
    },
    {
        label: 'Management',
        items: [
            { title: 'Meals', href: '/admin/meals', icon: UtensilsCrossed },
            { title: 'Companies', href: '/admin/companies', icon: Building2 },
            { title: 'App Settings', href: '/admin/settings', icon: Settings },
            { title: 'Staff', href: '/admin/staff', icon: UserCog, adminOnly: true },
        ],
    },
    {
        label: 'Insights',
        items: [
            { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
            { title: 'Activity Log', href: '/admin/activity', icon: Activity },
        ],
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    
    // Auth State
    const [userRole, setUserRole] = useState<'admin' | 'staff' | null>(null);
    const [userName, setUserName] = useState('Kim');
    const [accessiblePages, setAccessiblePages] = useState<string[]>([]);
    const [loadingSession, setLoadingSession] = useState(true);

    const supabase = createClient();

    // Initialize Supabase client and fetch session
    useEffect(() => {
        async function fetchUser() {
            try {
                // Using getUser() ensures we hit the server for the most up-to-date user data 
                // and avoid local session sync issues after password reset
                const { data: { user }, error } = await supabase.auth.getUser();
                if (user) {
                    const role = user.user_metadata?.role;
                    setUserRole(role);
                    setUserName(user.user_metadata?.name || (role === 'admin' ? 'Kim' : 'Staff'));
                    setAccessiblePages(user.user_metadata?.accessible_pages || []);
                } else {
                    setUserRole(null);
                    setAccessiblePages([]);
                }
            } catch (error) {
                console.error("Error fetching user session:", error);
            } finally {
                setLoadingSession(false);
            }
        }
        
        fetchUser();

        // Listen for auth state changes (e.g., login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
                fetchUser();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

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

    // Login page or contract pages — standalone, no sidebar
    if (pathname === '/admin/login' || pathname === '/admin/reset-password' || pathname.includes('/contracts/')) {
        return (
            <div className="min-h-screen bg-background">
                {children}
            </div>
        );
    }

    const filteredNavSections = ALL_NAV_SECTIONS.map(section => ({
        ...section,
        items: section.items.filter(item => {
            if (item.adminOnly && userRole !== 'admin') return false;
            if (userRole === 'admin') return true;
            // Staff logic
            return accessiblePages.includes(item.href) || 
                   accessiblePages.some(page => page !== '/admin' && item.href.startsWith(page));
        })
    })).filter(section => section.items.length > 0);

    return (
        <div className="flex min-h-screen bg-[#fafafa] overflow-x-hidden">
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isMobile && mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileOpen(false)}
                        className="fixed inset-0 bg-black/40 z-30 backdrop-blur-sm"
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
                                <span className="font-bold text-[14px] text-gray-900 truncate tracking-tight">Mountain Mama&apos;s</span>
                                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Admin Portal</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Nav */}
                <ScrollArea className="flex-1 py-4">
                    <nav className="space-y-6 px-3">
                        {filteredNavSections.map((section) => (
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

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={async () => { 
                            await supabase.auth.signOut();
                            window.location.href = '/admin/login'; 
                        }}
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
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-100 bg-white/80 backdrop-blur-xl px-4 sm:px-8">
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
                            {ALL_NAV_SECTIONS.flatMap(s => s.items).find(i => i.href === pathname)?.title || 'Dashboard'}
                        </motion.span>
                    </div>

                    {/* User */}
                    <div className="flex items-center gap-4 pl-4 border-l border-gray-100">
                        <div className="flex flex-col items-end leading-tight hidden sm:flex">
                            <span className="text-[13px] font-bold text-gray-900">{userName}</span>
                            <span className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">{userRole === 'admin' ? 'Administrator' : 'Staff'}</span>
                        </div>
                        <div className="relative group cursor-pointer">
                            <div className="size-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-violet-200 ring-4 ring-white transition-transform group-hover:scale-105">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-emerald-500 border-[3px] border-white shadow-sm" />
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
                    <div className="max-w-[1600px] mx-auto">
                        {!loadingSession ? children : (
                            <div className="flex items-center justify-center h-64">
                                <div className="size-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                </main>
            </motion.div>
        </div>
    );
}
