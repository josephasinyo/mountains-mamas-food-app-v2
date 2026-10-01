'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/supabase/activity-log';
import { revalidatePath } from 'next/cache';
import type { Ingredient } from '@/lib/supabase/types';

export async function getIngredients(): Promise<{ success: boolean; data?: Ingredient[]; error?: string }> {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('ingredients')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error: any) {
        console.error('Error fetching ingredients:', error);
        return { success: false, error: error.message };
    }
}

export async function createIngredient(formData: FormData): Promise<{ success: boolean; data?: Ingredient; error?: string }> {
    try {
        const supabase = createAdminClient();

        const name = (formData.get('name') as string)?.trim();
        const type = (formData.get('type') as string) || 'bread';
        const description = (formData.get('description') as string) || '';
        const is_active = formData.get('is_active') === 'true';
        const allergensRaw = formData.get('allergens') as string;
        let allergens: string[] = [];
        try {
            allergens = allergensRaw ? JSON.parse(allergensRaw) : [];
        } catch {
            allergens = [];
        }

        if (!name) {
            return { success: false, error: 'Name is required.' };
        }

        let image_url = (formData.get('image_url') as string) || '';
        const imageFile = formData.get('image_file') as File | null;

        if (imageFile && imageFile.size > 0) {
            const ext = imageFile.name.split('.').pop() || 'webp';
            const fileName = `ingredient-${crypto.randomUUID()}.${ext}`;
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('meal-images')
                .upload(fileName, buffer, { contentType: imageFile.type });
            
            if (uploadError) {
                console.error('Upload error:', uploadError);
            } else if (uploadData) {
                const { data: { publicUrl } } = supabase.storage.from('meal-images').getPublicUrl(uploadData.path);
                image_url = publicUrl;
            }
        }

        // Get highest sort_order for this type
        const { data: maxSortData } = await supabase
            .from('ingredients')
            .select('sort_order')
            .eq('type', type)
            .order('sort_order', { ascending: false })
            .limit(1);
        
        const nextSortOrder = (maxSortData && maxSortData[0]?.sort_order !== undefined) ? maxSortData[0].sort_order + 1 : 1;

        const { data: inserted, error: insertError } = await supabase
            .from('ingredients')
            .insert({
                name,
                type,
                description,
                image_url,
                allergens,
                is_active,
                sort_order: nextSortOrder,
            })
            .select()
            .single();

        if (insertError) throw insertError;

        await logActivity({
            userRole: 'admin',
            action: 'ingredient_created',
            entityType: 'meal',
            entityId: inserted.id,
            details: { name, type, allergens }
        });

        revalidatePath('/admin/ingredients');
        revalidatePath('/');
        return { success: true, data: inserted };
    } catch (error: any) {
        console.error('Error creating ingredient:', error);
        return { success: false, error: error.message };
    }
}

export async function updateIngredient(id: string, formData: FormData): Promise<{ success: boolean; data?: Ingredient; error?: string }> {
    try {
        const supabase = createAdminClient();

        const name = (formData.get('name') as string)?.trim();
        const type = (formData.get('type') as string) || 'bread';
        const description = (formData.get('description') as string) || '';
        const is_active = formData.get('is_active') === 'true';
        const allergensRaw = formData.get('allergens') as string;
        let allergens: string[] = [];
        try {
            allergens = allergensRaw ? JSON.parse(allergensRaw) : [];
        } catch {
            allergens = [];
        }

        if (!name) {
            return { success: false, error: 'Name is required.' };
        }

        let image_url = (formData.get('image_url') as string) || '';
        const imageFile = formData.get('image_file') as File | null;

        if (imageFile && imageFile.size > 0) {
            const ext = imageFile.name.split('.').pop() || 'webp';
            const fileName = `ingredient-${crypto.randomUUID()}.${ext}`;
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('meal-images')
                .upload(fileName, buffer, { contentType: imageFile.type });
            
            if (uploadError) {
                console.error('Upload error:', uploadError);
            } else if (uploadData) {
                const { data: { publicUrl } } = supabase.storage.from('meal-images').getPublicUrl(uploadData.path);
                image_url = publicUrl;
            }
        }

        const { data: updated, error: updateError } = await supabase
            .from('ingredients')
            .update({
                name,
                type,
                description,
                image_url,
                allergens,
                is_active,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        await logActivity({
            userRole: 'admin',
            action: 'ingredient_updated',
            entityType: 'meal',
            entityId: id,
            details: { name, type, allergens }
        });

        revalidatePath('/admin/ingredients');
        revalidatePath('/');
        return { success: true, data: updated };
    } catch (error: any) {
        console.error('Error updating ingredient:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteIngredient(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('ingredients')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await logActivity({
            userRole: 'admin',
            action: 'ingredient_deleted',
            entityType: 'meal',
            entityId: id,
        });

        revalidatePath('/admin/ingredients');
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting ingredient:', error);
        return { success: false, error: error.message };
    }
}

export async function toggleIngredientActive(id: string, is_active: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('ingredients')
            .update({ is_active, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        revalidatePath('/admin/ingredients');
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error('Error toggling ingredient active:', error);
        return { success: false, error: error.message };
    }
}

export async function updateIngredientSortOrder(id: string, direction: 'up' | 'down'): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = createAdminClient();

        const { data: current } = await supabase
            .from('ingredients')
            .select('*')
            .eq('id', id)
            .single();

        if (!current) return { success: false, error: 'Ingredient not found' };

        // Fetch all in this type sorted by sort_order
        const { data: siblings } = await supabase
            .from('ingredients')
            .select('id, sort_order')
            .eq('type', current.type)
            .order('sort_order', { ascending: true });

        if (!siblings || siblings.length <= 1) return { success: true };

        const currentIndex = siblings.findIndex((s: { id: string; sort_order: number }) => s.id === id);
        if (currentIndex === -1) return { success: false, error: 'Not found in list' };

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= siblings.length) return { success: true };

        const target = siblings[targetIndex] as { id: string; sort_order: number };

        // Swap sort_order
        const currentSort = current.sort_order;
        const targetSort = target.sort_order;

        const effectiveCurrentSort = currentSort === targetSort ? (direction === 'up' ? targetSort + 1 : targetSort - 1) : targetSort;
        const effectiveTargetSort = currentSort;

        await supabase.from('ingredients').update({ sort_order: effectiveCurrentSort }).eq('id', current.id);
        await supabase.from('ingredients').update({ sort_order: effectiveTargetSort }).eq('id', target.id);

        revalidatePath('/admin/ingredients');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating ingredient sort order:', error);
        return { success: false, error: error.message };
    }
}
