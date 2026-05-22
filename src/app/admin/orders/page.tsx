export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { OrdersClient } from './OrdersClient';

export default async function OrdersPage() {
    const supabase = createAdminClient();

    const { data: orders } = await supabase
        .from('orders')
        .select('*, tour_companies(name, slug), order_items(*)')
        .order('created_at', { ascending: false })
        .limit(100);

    const { data: companies } = await supabase
        .from('tour_companies')
        .select('id, name, status')
        .order('name');

    return <OrdersClient initialOrders={orders || []} companies={companies || []} />;
}
