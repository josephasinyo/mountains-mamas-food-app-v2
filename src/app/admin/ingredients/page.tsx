export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { IngredientsClient } from './IngredientsClient';
import type { Ingredient } from '@/lib/supabase/types';

export default async function IngredientsPage() {
    const supabase = createAdminClient();
    const { data: ingredients } = await supabase
        .from('ingredients')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

    return <IngredientsClient initialIngredients={(ingredients || []) as Ingredient[]} />;
}
