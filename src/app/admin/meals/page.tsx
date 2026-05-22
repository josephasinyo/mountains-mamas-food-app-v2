export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { MealsClient } from './MealsClient';

export default async function MealsPage() {
    const supabase = createAdminClient();
    const { data: meals } = await supabase
        .from('meals')
        .select('*')
        .order('sort_order', { ascending: true });

    return <MealsClient initialMeals={meals || []} />;
}
