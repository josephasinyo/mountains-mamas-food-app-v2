import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import AddToCartForm from './AddToCartForm';
import { FoodItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: item, error } = await supabase
    .from('meals')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !item) {
    notFound();
  }

  // Fetch active ingredients for rich dropdowns (breads & cookies)
  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  // Cast to FoodItem (our updated interface)
  const foodItem: FoodItem = {
    ...item,
    // Map database fields to interface if they differ slightly
    image_url: item.image_url || item.box_lunch_image_url || item.junior_box_lunch_image_url
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <AddToCartForm item={foodItem} ingredients={ingredients || []} />
    </div>
  );
}
