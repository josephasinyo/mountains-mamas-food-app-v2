export const dynamic = 'force-dynamic';

import { getCompanyDashboardData } from './actions';
import CompanyDashboardClient from './CompanyDashboardClient';

export default async function CompanyDashboardPage() {
    const data = await getCompanyDashboardData();
    
    return <CompanyDashboardClient initialData={data} />;
}
