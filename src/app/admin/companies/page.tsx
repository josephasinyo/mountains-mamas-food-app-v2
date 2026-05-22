export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { CompaniesClient } from './CompaniesClient';

export default async function CompaniesPage() {
    const supabase = createAdminClient();
    const { data: companies } = await supabase
        .from('tour_companies')
        .select('*, company_app_config(*), contracts(*), invoices(*)')
        .order('created_at', { ascending: false });

    return <CompaniesClient initialCompanies={companies || []} />;
}
