export const dynamic = 'force-dynamic';

import { getCompanyOrderHistory } from '../actions';
import OrderHistoryClient from './OrderHistoryClient';

export default async function CompanyOrdersPage() {
    const data = await getCompanyOrderHistory();
    
    // Wrap the orders in the expected format for the client
    const initialData = {
        recentOrders: data.success ? data.orders : []
    };
    
    return <OrderHistoryClient initialData={initialData} />;
}
