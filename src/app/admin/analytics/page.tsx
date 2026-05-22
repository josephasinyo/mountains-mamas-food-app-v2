import { createAdminClient } from '@/lib/supabase/server';
import { AnalyticsClient } from './AnalyticsClient';
import { formatDateUS } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
    const supabase = createAdminClient();
    
    // Get last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    // Fetch data for aggregation
    // Note: In a real production app, you might want to use a database function or view for complex aggregations.
    // For now, we'll fetch the data and aggregate in the server component.
    
    const [
        { data: orders },
        { data: companies },
        { data: orderItems }
    ] = await Promise.all([
        supabase.from('orders').select('*, tour_companies(name)').gte('created_at', dateStr),
        supabase.from('tour_companies').select('id, name, status'),
        supabase.from('order_items').select('*, orders!inner(*, tour_companies(name))').gte('orders.created_at', dateStr)
    ]);

    const activeOrderItems = orderItems?.filter((item: any) => (item.orders as any)?.status !== 'cancelled') || [];
    const cancelledOrderItems = orderItems?.filter((item: any) => (item.orders as any)?.status === 'cancelled') || [];

    // 1. Aggregation: Daily Orders (Excluding Cancelled)
    const dailyMap: Record<string, number> = {};
    const revenueMap: Record<string, number> = {};
    
    // Initialize last 30 days with 0
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const s = formatDateUS(d);
        dailyMap[s] = 0;
        revenueMap[s] = 0;
    }

    activeOrderItems.forEach((item: any) => {
        const orderCreatedAt = (item.orders as any)?.created_at;
        if (!orderCreatedAt) return;
        
        const d = formatDateUS(orderCreatedAt);
        if (dailyMap[d] !== undefined) {
            dailyMap[d] += (item.quantity || 0);
        }
    });

    // 2. Aggregation: Lunches by Company (Active Only)
    const companyMap: Record<string, number> = {};
    activeOrderItems.forEach((item: any) => {
        const name = (item.orders as any)?.tour_companies?.name || 'Individual';
        companyMap[name] = (companyMap[name] || 0) + (item.quantity || 0);
    });

    // 3. Aggregation: Popular Meals (Active Only)
    const mealMap: Record<string, number> = {};
    activeOrderItems.forEach((item: any) => {
        const name = item.meal_name || 'Unknown';
        mealMap[name] = (mealMap[name] || 0) + item.quantity;
    });

    // 4. Aggregation: Revenue over time (Active Only)
    activeOrderItems.forEach((item: any) => {
        const orderCreatedAt = (item.orders as any)?.created_at;
        if (!orderCreatedAt) return;
        
        const d = formatDateUS(orderCreatedAt);
        if (revenueMap[d] !== undefined) {
            revenueMap[d] += Number(item.unit_price) * item.quantity;
        }
    });

    // 5. Aggregate Quick Stats
    const totalRevenue = activeOrderItems.reduce((sum: number, item: any) => sum + (Number(item.unit_price) * item.quantity), 0);
    const totalLunches = activeOrderItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    const activeCompaniesCount = companies?.filter((c: any) => c.status === 'active').length || 0;
    const avgLunchValue = totalLunches > 0 ? totalRevenue / totalLunches : 0;

    // 6. Cancelled Stats
    const cancelledRevenue = cancelledOrderItems.reduce((sum: number, item: any) => sum + (Number(item.unit_price) * item.quantity), 0);
    const cancelledLunches = cancelledOrderItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

    // Format for Recharts
    const dailyOrdersData = Object.entries(dailyMap).map(([date, orders]) => ({ date, orders }));
    const companyLunchesData = Object.entries(companyMap).map(([name, lunches]) => ({ name, lunches })).sort((a, b) => b.lunches - a.lunches);
    const popularMealsData = Object.entries(mealMap).map(([name, orders]) => ({ name, orders })).sort((a, b) => b.orders - a.orders).slice(0, 5);
    const revenueData = Object.entries(revenueMap).map(([date, revenue]) => ({ date, revenue: Number(revenue.toFixed(2)) }));

    return (
        <AnalyticsClient 
            dailyOrders={dailyOrdersData}
            companyLunches={companyLunchesData}
            popularMeals={popularMealsData}
            revenueData={revenueData}
            stats={{
                totalRevenue,
                totalLunches,
                activeCompaniesCount,
                avgLunchValue,
                cancelledRevenue,
                cancelledLunches
            }}
        />
    );
}
