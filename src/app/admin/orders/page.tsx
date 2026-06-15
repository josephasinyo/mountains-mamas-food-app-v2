export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { OrdersClient } from './OrdersClient';

export default async function OrdersPage() {
    const supabase = createAdminClient();

    const { data: orders } = await supabase
        .from('orders')
        .select('*, tour_companies(name, slug, prep_instructions), order_items(*)')
        .order('created_at', { ascending: false })
        .limit(100);

    const { data: companies } = await supabase
        .from('tour_companies')
        .select('id, name, status, prep_instructions')
        .order('name');

    return <OrdersClient initialOrders={orders || []} companies={companies || []} />;
}
