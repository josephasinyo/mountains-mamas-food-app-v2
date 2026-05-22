import { createAdminClient, createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    ShoppingCart, AlertCircle, Building2, UtensilsCrossed,
    CalendarDays, TrendingUp, ArrowUpRight, Clock, ArrowRight, Activity,
} from 'lucide-react';
import RecentOrdersTable from './RecentOrdersTable';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const supabaseAdmin = createAdminClient();
    const supabaseClient = await createClient();
    
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [
        { data: allOrdersData },
        { data: todayOrdersData },
        { data: pendingOrdersData },
        { count: activeCompanies },
        { count: totalMeals },
        { data: monthOrdersData },
        { data: recentOrders },
        { data: { user } },
    ] = await Promise.all([
        supabaseAdmin.from('orders').select('order_items(quantity)'),
        supabaseAdmin.from('orders').select('order_items(quantity)').eq('tour_date', today),
        supabaseAdmin.from('orders').select('order_items(quantity)').eq('status', 'pending'),
        supabaseAdmin.from('tour_companies').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabaseAdmin.from('meals').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabaseAdmin.from('orders').select('order_items(quantity)').gte('created_at', monthStart),
        supabaseAdmin.from('orders').select('*, tour_companies(name), order_items(*)').order('created_at', { ascending: false }).limit(8),
        supabaseClient.auth.getUser()
    ]);

    const sumLunches = (orders: any[] | null) => {
        if (!orders) return 0;
        return orders.reduce((sum, order) => {
            const items = order.order_items || [];
            const orderSum = Array.isArray(items) 
                ? items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)
                : 0;
            return sum + orderSum;
        }, 0);
    };

    const totalOrdersCount = allOrdersData?.length || 0;
    const todayOrdersCount = todayOrdersData?.length || 0;
    const pendingOrdersCount = pendingOrdersData?.length || 0;
    const monthOrdersCount = monthOrdersData?.length || 0;

    const totalLunches = sumLunches(allOrdersData);
    const todayLunches = sumLunches(todayOrdersData);
    const pendingLunches = sumLunches(pendingOrdersData);
    const monthLunches = sumLunches(monthOrdersData);

    const stats = [
        {
            label: "Today's Lunches", value: todayLunches || 0,
            icon: ShoppingCart, description: `${todayOrdersCount} order${todayOrdersCount !== 1 ? 's' : ''}`,
            gradient: 'from-violet-500 to-purple-600', iconBg: 'bg-violet-50 text-violet-600',
        },
        {
            label: 'Pending Lunches', value: pendingLunches || 0,
            icon: AlertCircle,
            description: `${pendingOrdersCount} pending order${pendingOrdersCount !== 1 ? 's' : ''}`,
            gradient: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-50 text-amber-600',
        },
        {
            label: 'Active Companies', value: activeCompanies || 0,
            icon: Building2, description: 'Tour partners',
            gradient: 'from-emerald-500 to-teal-600', iconBg: 'bg-emerald-50 text-emerald-600',
        },
        {
            label: "Month's Lunches", value: monthLunches || 0,
            icon: CalendarDays, description: `${monthOrdersCount} order${monthOrdersCount !== 1 ? 's' : ''}`,
            gradient: 'from-blue-500 to-cyan-500', iconBg: 'bg-blue-50 text-blue-600',
        },
        {
            label: 'Menu Items', value: totalMeals || 0,
            icon: UtensilsCrossed, description: 'Active meals',
            gradient: 'from-rose-500 to-pink-600', iconBg: 'bg-rose-50 text-rose-600',
        },
        {
            label: 'All Time Lunches', value: totalLunches || 0,
            icon: TrendingUp, description: `${totalOrdersCount} order${totalOrdersCount !== 1 ? 's' : ''}`,
            gradient: 'from-indigo-500 to-violet-600', iconBg: 'bg-indigo-50 text-indigo-600',
        },
    ];

    const userRole = user?.user_metadata?.role || 'admin';
    const userName = user?.user_metadata?.name || (userRole === 'admin' ? 'Kim' : 'Staff');

    return (
        <div className="space-y-6 max-w-[1400px]">
            {/* Welcome header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Good {getGreeting()}, {userName} 👋
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Here&apos;s what&apos;s happening with your café today.
                    </p>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <Link
                        href="/admin/orders"
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                    >
                        <ShoppingCart className="size-4 text-gray-400" />
                        View Orders
                    </Link>
                    {userRole === 'admin' && (
                        <Link
                            href="/admin/meals"
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all shadow-md shadow-violet-200"
                        >
                            <UtensilsCrossed className="size-4" />
                            Manage Menu
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {stats.map((stat) => (
                    <Card key={stat.label} className="group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`flex items-center justify-center size-9 rounded-lg ${stat.iconBg}`}>
                                    <stat.icon className="size-4" />
                                </div>
                                <ArrowUpRight className="size-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            </div>
                            <div>
                                <span className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</span>
                            </div>
                            <p className="text-[11px] font-bold text-muted-foreground mt-0.5 uppercase tracking-wider leading-none">
                                {stat.label}
                            </p>
                            {stat.description && (
                                <p className="text-[10px] font-medium text-gray-400 mt-1 leading-none">
                                    {stat.description}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main content - Recent Orders */}
            <div className="space-y-4">
                {/* Recent Orders */}
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <div>
                            <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
                            <CardDescription className="text-xs">Latest orders across all companies</CardDescription>
                        </div>
                        <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                            View All <ArrowRight className="size-3" />
                        </Link>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <RecentOrdersTable initialOrders={recentOrders || []} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
}
