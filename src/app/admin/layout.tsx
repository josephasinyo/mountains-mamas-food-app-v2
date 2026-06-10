'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    LayoutDashboard, ShoppingCart, ClipboardList, UtensilsCrossed,
    Building2, FileText, ScrollText, BarChart3, Activity,
    LogOut, Ticket, Mountain, PanelLeftClose, PanelLeft, Settings, UserCog,
    BellRing, X, Eye
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OrderItemDetails } from '@/components/ui/OrderItemCustomFields';
import { playSoundAlert } from '@/lib/sound-alerts';

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

function formatRelativeTime(dateInput: string | Date): string {
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'yesterday';
    return `${diffDays}d ago`;
}

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

    // Toast Dialog State
    const [selectedOrderForToast, setSelectedOrderForToast] = useState<any | null>(null);
    const [toastOrderItems, setToastOrderItems] = useState<any[]>([]);
    const [isToastDialogOpen, setIsToastDialogOpen] = useState(false);

    // Audio Context Ref to handle autoplay security policy
    const audioContextRef = useRef<AudioContext | null>(null);
    const [isAudioSuspended, setIsAudioSuspended] = useState(false);
    const [orderNotifications, setOrderNotifications] = useState<any[]>([]);
    const [showNotifSidebar, setShowNotifSidebar] = useState(false);

    // Initialize and unlock AudioContext on first user interaction
    useEffect(() => {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        let ctx: AudioContext | null = null;
        if (AudioCtx) {
            ctx = new AudioCtx();
            audioContextRef.current = ctx;
            if (ctx.state === 'suspended') {
                setIsAudioSuspended(true);
            }
            ctx.onstatechange = () => {
                if (ctx) {
                    setIsAudioSuspended(ctx.state === 'suspended');
                }
            };
        }

        const initAudio = () => {
            if (!audioContextRef.current && AudioCtx) {
                audioContextRef.current = new AudioCtx();
            }
            const currentCtx = audioContextRef.current;
            if (currentCtx && currentCtx.state === 'suspended') {
                currentCtx.resume()
                    .then(() => setIsAudioSuspended(false))
                    .catch((err) => console.warn('Could not resume AudioContext:', err));
            } else if (currentCtx && currentCtx.state === 'running') {
                setIsAudioSuspended(false);
            }
        };

        window.addEventListener('click', initAudio, { capture: true });
        window.addEventListener('keydown', initAudio, { capture: true });
        return () => {
            window.removeEventListener('click', initAudio, { capture: true });
            window.removeEventListener('keydown', initAudio, { capture: true });
            if (ctx) {
                ctx.onstatechange = null;
            }
        };
    }, []);

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

    // Fetch today's orders on load
    useEffect(() => {
        if (!userRole) return;
        async function fetchTodaysOrders() {
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const { data: orders, error } = await supabase
                    .from('orders')
                    .select('*, tour_companies(name), order_items(meal_name, quantity, box_type, bread_type, cookie_choice, guest_name, customizations, unit_price, custom_fields)')
                    .gte('created_at', today.toISOString())
                    .order('created_at', { ascending: false });

                if (orders) {
                    const formatted = orders.map((order: any) => {
                        const totalItems = order.order_items 
                            ? order.order_items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) 
                            : 0;
                        const tourDateStr = order.tour_date 
                            ? new Date(order.tour_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                            : 'N/A';
                        return {
                            ...order,
                            company_name: order.tour_companies?.name || 'N/A',
                            items: order.order_items || [],
                            totalItems,
                            tourDateStr
                        };
                    });
                    setOrderNotifications(formatted);
                }
            } catch (err) {
                console.error("Error loading today's orders:", err);
            }
        }
        fetchTodaysOrders();
    }, [supabase, userRole]);

    // Subscribe to realtime order notifications for sound alerts
    useEffect(() => {
        if (!userRole) return;

        const channel = supabase
            .channel('admin-orders-sound-alerts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                },
                async (payload) => {
                    const newOrder = payload.new;

                    const isMuted = localStorage.getItem('admin_new_order_sound_muted') === 'true';
                    if (!isMuted) {
                        try {
                            if (!audioContextRef.current) {
                                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                                if (AudioCtx) {
                                    audioContextRef.current = new AudioCtx();
                                }
                            }
                            const ctx = audioContextRef.current;
                            if (ctx) {
                                if (ctx.state === 'suspended') {
                                    ctx.resume().catch(() => {});
                                }
                                playSoundAlert(ctx);
                            }
                        } catch (e) {
                            console.error('Audio play failed:', e);
                        }
                    }

                    // Fetch order items to display details in toast
                    const { data: items } = await supabase
                        .from('order_items')
                        .select('meal_name, quantity, box_type, bread_type, cookie_choice, guest_name, customizations, unit_price, custom_fields')
                        .eq('order_id', newOrder.id);

                    const totalItems = items ? items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
                    const first3 = items ? items.slice(0, 3) : [];
                    const hasMore = items && items.length > 3;

                    const tourDateStr = newOrder.tour_date 
                        ? new Date(newOrder.tour_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                        : 'N/A';

                    // Fetch company name
                    let companyName = 'N/A';
                    if (newOrder.company_id) {
                        const { data: compData } = await supabase
                            .from('tour_companies')
                            .select('name')
                            .eq('id', newOrder.company_id)
                            .single();
                        if (compData) {
                            companyName = compData.name;
                        }
                    }

                    const itemsSummary = items && items.length > 0
                        ? items.map((i: any) => `${i.quantity}x ${i.meal_name}`).join(', ')
                        : '';

                    // Show custom visual toast notification that does not auto-close
                    toast.custom(
                        (t) => (
                            <div className="w-[360px] bg-white/95 backdrop-blur-md border border-violet-100 rounded-[18px] shadow-[0_15px_30px_-5px_rgba(109,40,217,0.08),0_10px_20px_-10px_rgba(109,40,217,0.04)] p-4.5 flex flex-col gap-2.5 relative overflow-hidden pointer-events-auto border-t-4 border-t-violet-600">
                                {/* Close Button */}
                                <button 
                                    onClick={() => toast.dismiss(t)}
                                    className="absolute top-3.5 right-3.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 p-1 rounded-lg transition-all"
                                >
                                    <X className="size-4" />
                                </button>

                                {/* Header */}
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[11px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-1.5">
                                        🧺 New Order
                                    </span>
                                    <span className="text-[14px] font-extrabold text-gray-900 leading-snug pr-6">
                                        {companyName} — {tourDateStr}
                                    </span>
                                </div>

                                {/* Inline Meta Info */}
                                <div className="flex items-center gap-2.5 text-xs text-gray-500 font-semibold mt-1">
                                    <span className="flex items-center gap-1">
                                        <span className="text-gray-400">Guide:</span>
                                        <span className="text-gray-800 font-bold">{newOrder.guide_name || 'N/A'}</span>
                                    </span>
                                    <span className="h-3 w-px bg-gray-200" />
                                    <span className="flex items-center gap-1">
                                        <span className="text-violet-600 font-black">{totalItems} {totalItems === 1 ? 'Lunch' : 'Lunches'}</span>
                                    </span>
                                </div>

                                {/* Footer Summary & Action */}
                                <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-gray-100/60">
                                    <span className="text-[10px] text-gray-400 font-semibold truncate max-w-[200px]" title={itemsSummary}>
                                        {itemsSummary}
                                    </span>
                                    <button
                                        onClick={() => {
                                            const formattedOrder = { 
                                                ...newOrder, 
                                                company_name: companyName, 
                                                items, 
                                                totalItems, 
                                                tourDateStr 
                                            };
                                            setSelectedOrderForToast(formattedOrder);
                                            setToastOrderItems(items || []);
                                            setIsToastDialogOpen(true);
                                            toast.dismiss(t);
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-700 transition-colors shrink-0"
                                    >
                                        View Details <Eye className="size-3" />
                                    </button>
                                </div>
                            </div>
                        ),
                        {
                            duration: Infinity, // keep toast open until manually dismissed
                        }
                    );
                    // store notification for sidebar
                    setOrderNotifications(prev => [
                        { ...newOrder, company_name: companyName, items, totalItems, tourDateStr },
                        ...prev
                    ]);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                },
                async (payload) => {
                    const updatedOrder = payload.new;
                    setOrderNotifications(prev => 
                        prev.map(notif => 
                            notif.id === updatedOrder.id 
                                ? { ...notif, status: updatedOrder.status } 
                                : notif
                        )
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, userRole]);

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

    const pendingNotificationsCount = orderNotifications.filter(
        notif => new Date(notif.created_at).toDateString() === new Date().toDateString() && notif.status === 'pending'
    ).length;

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

            {/* Notification Sidebar (moved outside main sidebar to avoid stacking context blur bugs) */}
            <AnimatePresence>
                {showNotifSidebar && (
                    <motion.aside
                        initial={{ x: 300 }}
                        animate={{ x: 0 }}
                        exit={{ x: 300 }}
                        className="fixed inset-y-0 right-0 z-[60] w-80 bg-white/95 backdrop-blur-lg border-l rounded-l-2xl shadow-2xl p-4 overflow-y-auto"
                    >
                        <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-100">
                            <h2 className="text-lg font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                🔔 Today's Orders
                            </h2>
                            <button
                                onClick={() => setShowNotifSidebar(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        <div className="space-y-3 mt-4">
                            {orderNotifications
                                .filter(notif => new Date(notif.created_at).toDateString() === new Date().toDateString() && notif.status === 'pending')
                                .map((notif, idx) => {
                                    const isSelected = isToastDialogOpen && selectedOrderForToast?.id === notif.id;
                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "p-4 rounded-2xl border cursor-pointer transition-all duration-200 group shadow-sm",
                                                isSelected 
                                                    ? "border-violet-600 bg-violet-50/30 shadow-md shadow-violet-100/50 ring-2 ring-violet-600/10"
                                                    : "bg-white border-gray-100 hover:border-violet-300 hover:bg-violet-50/15 hover:shadow-md hover:shadow-violet-100/50"
                                            )}
                                            onClick={() => {
                                                setSelectedOrderForToast(notif);
                                                setToastOrderItems(notif.items || []);
                                                setIsToastDialogOpen(true);
                                            }}
                                        >
                                            <div className="flex justify-between items-start gap-2 mb-2">
                                                <span className={cn(
                                                    "font-extrabold text-[14px] leading-tight transition-colors",
                                                    isSelected ? "text-violet-700" : "text-gray-900 group-hover:text-violet-700"
                                                )}>
                                                    {notif.company_name || 'Tour Company'}
                                                </span>
                                                <span className={cn(
                                                    "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 transition-colors",
                                                    isSelected 
                                                        ? "bg-violet-600 text-white" 
                                                        : "bg-violet-50 text-violet-700 group-hover:bg-violet-100/70"
                                                )}>
                                                    {notif.totalItems} {notif.totalItems === 1 ? 'Lunch' : 'Lunches'}
                                                </span>
                                            </div>
                                            
                                            <div className="space-y-1 text-xs font-semibold text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-gray-400">Tour Date:</span>
                                                    <span className={cn(
                                                        "transition-colors",
                                                        isSelected ? "text-violet-900" : "text-gray-700"
                                                    )}>{notif.tourDateStr || new Date(notif.tour_date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-gray-400">Guide:</span>
                                                    <span className={cn(
                                                        "transition-colors",
                                                        isSelected ? "text-violet-900" : "text-gray-700"
                                                    )}>{notif.guide_name || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className="text-gray-400 shrink-0">Guest Name:</span>
                                                        <span className={cn(
                                                            "transition-colors truncate",
                                                            isSelected ? "text-violet-900" : "text-gray-700"
                                                        )}>{notif.customer_name || 'N/A'}</span>
                                                    </div>
                                                    <span className={cn(
                                                        "text-[10px] font-extrabold tracking-tight shrink-0 transition-colors",
                                                        isSelected ? "text-violet-600" : "text-gray-400 group-hover:text-gray-500"
                                                    )}>
                                                        {formatRelativeTime(notif.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            {orderNotifications.filter(notif => new Date(notif.created_at).toDateString() === new Date().toDateString() && notif.status === 'pending').length === 0 && (
                                <div className="text-center py-8 text-sm text-gray-400 font-medium">
                                    No pending orders received today.
                                </div>
                            )}
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main area */}
            <motion.div 
                animate={isMobile ? { marginLeft: 0 } : { marginLeft: collapsed ? 70 : 260 }}
                transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                className="flex-1 flex flex-col min-w-0"
            >
                {/* Autoplay Warning Banner */}
                {isAudioSuspended && (
                    <div 
                        onClick={() => {
                            if (audioContextRef.current) {
                                audioContextRef.current.resume().then(() => {
                                    setIsAudioSuspended(false);
                                });
                            }
                        }}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold py-2.5 px-4 text-center cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 animate-in fade-in select-none shrink-0 shadow-md"
                    >
                        <span>🔔 Sound alerts are paused. Click anywhere on this page to enable order notification sounds.</span>
                    </div>
                )}

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
                    {/* Notification ring icon */}
                    
                    
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

                    <button
                        onClick={() => setShowNotifSidebar(true)}
                        className="relative flex items-center justify-center size-9 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
                    >
                        <BellRing className="size-[18px]" />
                        {pendingNotificationsCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white ring-2 ring-white animate-pulse">
                                {pendingNotificationsCount}
                            </span>
                        )}
                    </button>

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

                {/* Realtime Order Details Dialog */}
                <Dialog open={isToastDialogOpen} onOpenChange={setIsToastDialogOpen}>
                    <DialogContent className="sm:max-w-[650px] bg-white rounded-2xl border-gray-150">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl font-extrabold text-gray-900">
                                <ShoppingCart className="size-5 text-violet-600" />
                                New Order Details
                            </DialogTitle>
                            <DialogDescription className="text-sm text-gray-500 font-medium">
                                Real-time order details received for this tour.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedOrderForToast && (
                            <div className="space-y-4 my-2 text-sm text-gray-700">
                                {/* Metadata grid */}
                                <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                    <div>
                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Customer</span>
                                        <span className="font-bold text-gray-900">{selectedOrderForToast.customer_name}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Guide</span>
                                        <span className="font-bold text-gray-900">{selectedOrderForToast.guide_name || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Tour Date</span>
                                        <span className="font-bold text-gray-900">
                                            {selectedOrderForToast.tour_date 
                                                ? new Date(selectedOrderForToast.tour_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                                                : 'N/A'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Pickup Time</span>
                                        <span className="font-bold text-gray-900">{selectedOrderForToast.pickup_time || 'N/A'}</span>
                                    </div>
                                </div>

                                {/* Order details matching expanded orders page design */}
                                <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                                    {/* Section 1: Items List */}
                                    <div className="divide-y divide-gray-100/70 max-h-[260px] overflow-y-auto">
                                        {toastOrderItems.map((item: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="font-black text-violet-600 text-base w-8">
                                                        {item.quantity}x
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="font-extrabold text-base text-gray-900 leading-tight">{item.meal_name}</p>
                                                        <OrderItemDetails item={item} />
                                                    </div>
                                                </div>
                                                <div className="text-right ml-8">
                                                    <p className="font-bold text-base text-gray-900 tracking-tight">
                                                        ${((item.unit_price || 0) * item.quantity).toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                                                        ${(item.unit_price || 0).toFixed(2)} ea
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedOrderForToast.notes && (
                                        <div className="bg-amber-50/30 p-6">
                                            <span className="text-[11px] font-black text-amber-700 uppercase tracking-[0.2em] block mb-2">KITCHEN NOTES</span>
                                            <p className="text-[15px] text-amber-900 font-black italic leading-relaxed">&ldquo;{selectedOrderForToast.notes}&rdquo;</p>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center justify-between p-6 bg-gray-50/30 gap-4">
                                        <div className="flex items-center gap-6 sm:gap-10">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pickup</span>
                                                <span className="text-[14px] font-black text-gray-900">{selectedOrderForToast.pickup_time || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Payment</span>
                                                <span className="text-[14px] font-black text-gray-900 capitalize">{selectedOrderForToast.payment_status?.replace('_', ' ') || 'N/A'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Placed At</span>
                                                <span className="text-[14px] font-black text-gray-900">
                                                    {new Date(selectedOrderForToast.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="text-right flex items-center gap-4">
                                            <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">TOTAL AMOUNT</span>
                                            <span className="text-[20px] font-black text-violet-600 tracking-tighter">
                                                ${toastOrderItems.reduce((acc: number, item: any) => acc + (Number(item.unit_price || 0) * item.quantity), 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="flex flex-row items-center gap-3 w-full mt-4 sm:space-x-0">
                            <Button 
                                variant="outline" 
                                onClick={() => setIsToastDialogOpen(false)}
                                className="flex-1 rounded-xl font-bold h-11 border-gray-200 text-gray-700 hover:bg-gray-50"
                            >
                                Close
                            </Button>
                            <Button 
                                onClick={() => {
                                    if (selectedOrderForToast) {
                                        window.location.href = `/admin/orders?print=${selectedOrderForToast.id}`;
                                    }
                                }}
                                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold h-11 gap-1.5"
                            >
                                <Ticket className="size-4" />
                                Print Ticket
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </motion.div>
        </div>
    );
}
