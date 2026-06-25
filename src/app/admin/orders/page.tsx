export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { OrdersClient } from './OrdersClient';

export default async function OrdersPage() {
    const supabase = createAdminClient();

    const { data: orders, count } = await supabase
        .from('orders')
        .select('*, tour_companies(name, slug, prep_instructions), order_items(*), order_change_requests(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 99);

    const { count: initialPending } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    const { data: initialLunchesData } = await supabase
        .from('order_items')
        .select('quantity');
    const initialTotalLunches = (initialLunchesData || []).reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);

    const { data: companies } = await supabase
        .from('tour_companies')
        .select('id, name, status, prep_instructions')
        .order('name');

    const { data: changeRequests } = await supabase
        .from('order_change_requests')
        .select('*, orders(*, order_items(*)), tour_companies(name, email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    return (
        <OrdersClient 
            initialOrders={orders || []} 
            initialTotalCount={count || 0} 
            initialTotalLunches={initialTotalLunches}
            initialPendingCount={initialPending || 0}
            companies={companies || []} 
            initialChangeRequests={changeRequests || []}
        />
    );
}
