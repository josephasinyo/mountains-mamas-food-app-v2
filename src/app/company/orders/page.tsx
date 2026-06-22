export const dynamic = 'force-dynamic';

import { getPaginatedCompanyOrders } from '../actions';
import OrderHistoryClient from './OrderHistoryClient';

export default async function CompanyOrdersPage() {
    const data = await getPaginatedCompanyOrders({ page: 1, limit: 100, dateFilterMode: 'tour' });
    
    const initialData = {
        recentOrders: data.success ? data.orders : [],
        totalCount: data.success ? data.totalCount : 0,
        totalLunches: data.success ? data.totalLunches : 0,
        pendingCount: data.success ? data.pendingCount : 0
    };
    
    return <OrderHistoryClient initialData={initialData} />;
}
