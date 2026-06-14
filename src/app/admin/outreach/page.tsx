export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { OutreachClient } from './OutreachClient';

export default async function OutreachPage() {
    const supabase = createAdminClient();
    const { data: leads } = await supabase
        .from('outreach_leads')
        .select('*')
        .order('created_at', { ascending: false });

    return <OutreachClient initialLeads={leads || []} />;
}
