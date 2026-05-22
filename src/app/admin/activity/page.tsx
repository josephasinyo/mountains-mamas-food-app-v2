import { createAdminClient } from '@/lib/supabase/server';
import { ActivityClient } from './ActivityClient';

export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
    const supabase = createAdminClient();

    const { data: logs } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

    return <ActivityClient initialLogs={logs || []} />;
}
