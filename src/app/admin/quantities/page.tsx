import { createAdminClient } from '@/lib/supabase/server';
import { QuantitiesClient } from './QuantitiesClient';

export const dynamic = 'force-dynamic';

export default async function QuantitiesPage() {
    const supabase = createAdminClient();

    // Fetch all orders with items to allow client-side filtering and aggregation
    const { data: orders } = await supabase
        .from('orders')
        .select('*, tour_companies(name, slug), order_items(*)')
        .order('created_at', { ascending: false });

    const { data: companies } = await supabase
        .from('tour_companies')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

    return <QuantitiesClient initialOrders={orders || []} companies={companies || []} />;
}
