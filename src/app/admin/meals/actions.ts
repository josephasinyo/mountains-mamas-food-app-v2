'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/supabase/activity-log';

async function uploadImage(file: File) {
    if (!file || file.size === 0) return null;
    
    const supabase = createAdminClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `meals/${fileName}`;

    const { data, error } = await supabase.storage
        .from('meal-images')
        .upload(filePath, file);

    if (error) {
        console.error('Storage upload error:', error);
        throw new Error('Failed to upload image');
    }

    const { data: { publicUrl } } = supabase.storage
        .from('meal-images')
        .getPublicUrl(filePath);

    return publicUrl;
}

export async function createMeal(formData: FormData) {
    const supabase = createAdminClient();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = formData.get('price') as string;
    const box_includes = formData.get('box_includes') as string;
    const juniorPrice = formData.get('junior_price') as string;
    const juniorBoxIncludes = formData.get('junior_box_includes') as string;
    
    const category = formData.get('category') as string;
    const lunch_package = formData.get('lunch_package') as any;
    const allow_split_box = formData.get('allow_split_box') === 'true';
    const is_active = formData.get('is_active') === 'true';
    const imageFile = formData.get('image_file') as File | null;
    const standardImageFile = formData.get('standard_image_file') as File | null;
    const juniorImageFile = formData.get('junior_image_file') as File | null;

    let image_url = (formData.get('image_url') as string) || '';
    let box_lunch_image_url = (formData.get('standard_image_url') as string) || '';
    let junior_box_lunch_image_url = (formData.get('junior_image_url') as string) || '';
    const sandwichPrice = formData.get('sandwich_price') as string;

    // Debug: log file details received from client
    console.log('[createMeal] Files received:', {
        main: imageFile ? { name: imageFile.name, size: imageFile.size, type: imageFile.type } : 'none',
        standard: standardImageFile ? { name: standardImageFile.name, size: standardImageFile.size, type: standardImageFile.type } : 'none',
        junior: juniorImageFile ? { name: juniorImageFile.name, size: juniorImageFile.size, type: juniorImageFile.type } : 'none',
    });

    if (category === 'sandwich' && (!sandwichPrice || isNaN(parseFloat(sandwichPrice)))) {
        return { success: false, error: 'Sandwich only price is required.' };
    }

    try {
        if (imageFile && imageFile.size > 0) {
            const ext = imageFile.name.split('.').pop() || 'webp';
            const fileName = `main-${crypto.randomUUID()}.${ext}`;
            console.log(`[createMeal] Uploading MAIN: ${fileName} (${imageFile.size} bytes)`);
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const { data, error: uploadError } = await supabase.storage
                .from('meal-images')
                .upload(fileName, buffer, { contentType: imageFile.type });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('meal-images').getPublicUrl(data.path);
            image_url = publicUrl;
        }

        if (standardImageFile && standardImageFile.size > 0) {
            const ext = standardImageFile.name.split('.').pop() || 'webp';
            const fileName = `std-${crypto.randomUUID()}.${ext}`;
            console.log(`[createMeal] Uploading STANDARD: ${fileName} (${standardImageFile.size} bytes)`);
            const buffer = Buffer.from(await standardImageFile.arrayBuffer());
            const { data, error: uploadError } = await supabase.storage
                .from('meal-images')
                .upload(fileName, buffer, { contentType: standardImageFile.type });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('meal-images').getPublicUrl(data.path);
            box_lunch_image_url = publicUrl;
        }

        if (juniorImageFile && juniorImageFile.size > 0) {
            const ext = juniorImageFile.name.split('.').pop() || 'webp';
            const fileName = `jr-${crypto.randomUUID()}.${ext}`;
            console.log(`[createMeal] Uploading JUNIOR: ${fileName} (${juniorImageFile.size} bytes)`);
            const buffer = Buffer.from(await juniorImageFile.arrayBuffer());
            const { data, error: uploadError } = await supabase.storage
                .from('meal-images')
                .upload(fileName, buffer, { contentType: juniorImageFile.type });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('meal-images').getPublicUrl(data.path);
            junior_box_lunch_image_url = publicUrl;
        }

        // Sandwich uses main image_url directly

        const { data, error } = await supabase
            .from('meals')
            .insert({
                name,
                description,
                price: parseFloat(price),
                box_includes: box_includes,
                category,
                lunch_package,
                allow_split_box,
                is_active,
                image_url,
                box_lunch_image_url,
                junior_price: juniorPrice ? parseFloat(juniorPrice) : null,
                junior_box_includes: juniorBoxIncludes,
                junior_box_lunch_image_url,
                sandwich_price: sandwichPrice ? parseFloat(sandwichPrice) : null,
                sandwich_image_url: null
            })
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        await logActivity({
            userRole: 'admin',
            action: 'meal_created',
            entityType: 'meal',
            entityId: data.id,
            details: { name: name, price: price },
        });

        return { success: true, data };
    } catch (err: any) {
        console.error('[createMeal] Error:', err);
        return { success: false, error: err?.message || 'Failed to create meal' };
    }
}

export async function updateMeal(id: string, formData: FormData) {
    const supabase = createAdminClient();

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = formData.get('price') as string;
    const box_includes = formData.get('box_includes') as string;
    const juniorPrice = formData.get('junior_price') as string;
    const juniorBoxIncludes = formData.get('junior_box_includes') as string;
    
    const category = formData.get('category') as string;
    const lunch_package = formData.get('lunch_package') as any;
    const allow_split_box = formData.get('allow_split_box') === 'true';
    const is_active = formData.get('is_active') === 'true';
    const imageFile = formData.get('image_file') as File | null;
    const standardImageFile = formData.get('standard_image_file') as File | null;
    const juniorImageFile = formData.get('junior_image_file') as File | null;

    let image_url = (formData.get('image_url') as string) || '';
    let box_lunch_image_url = (formData.get('standard_image_url') as string) || '';
    let junior_box_lunch_image_url = (formData.get('junior_image_url') as string) || '';
    const sandwichPrice = formData.get('sandwich_price') as string;

    // Debug: log file details received from client
    console.log('[updateMeal] Files received:', {
        main: imageFile ? { name: imageFile.name, size: imageFile.size, type: imageFile.type } : 'none',
        standard: standardImageFile ? { name: standardImageFile.name, size: standardImageFile.size, type: standardImageFile.type } : 'none',
        junior: juniorImageFile ? { name: juniorImageFile.name, size: juniorImageFile.size, type: juniorImageFile.type } : 'none',
    });
    console.log('[updateMeal] Existing URLs:', { image_url, box_lunch_image_url, junior_box_lunch_image_url });

    if (category === 'sandwich' && (!sandwichPrice || isNaN(parseFloat(sandwichPrice)))) {
        return { success: false, error: 'Sandwich only price is required.' };
    }

    try {
        // Upload each image with a completely unique UUID-based filename
        if (imageFile && imageFile.size > 0) {
            const ext = imageFile.name.split('.').pop() || 'webp';
            const fileName = `main-${crypto.randomUUID()}.${ext}`;
            console.log(`[updateMeal] Uploading MAIN image: ${fileName} (${imageFile.size} bytes)`);
            const buffer = Buffer.from(await imageFile.arrayBuffer());
            const { data, error: uploadError } = await supabase.storage
                .from('meal-images')
                .upload(fileName, buffer, { contentType: imageFile.type });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('meal-images').getPublicUrl(data.path);
            image_url = publicUrl;
        }

        if (standardImageFile && standardImageFile.size > 0) {
            const ext = standardImageFile.name.split('.').pop() || 'webp';
            const fileName = `std-${crypto.randomUUID()}.${ext}`;
            console.log(`[updateMeal] Uploading STANDARD image: ${fileName} (${standardImageFile.size} bytes)`);
            const buffer = Buffer.from(await standardImageFile.arrayBuffer());
            const { data, error: uploadError } = await supabase.storage
                .from('meal-images')
                .upload(fileName, buffer, { contentType: standardImageFile.type });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('meal-images').getPublicUrl(data.path);
            box_lunch_image_url = publicUrl;
        }

        if (juniorImageFile && juniorImageFile.size > 0) {
            const ext = juniorImageFile.name.split('.').pop() || 'webp';
            const fileName = `jr-${crypto.randomUUID()}.${ext}`;
            console.log(`[updateMeal] Uploading JUNIOR image: ${fileName} (${juniorImageFile.size} bytes)`);
            const buffer = Buffer.from(await juniorImageFile.arrayBuffer());
            const { data, error: uploadError } = await supabase.storage
                .from('meal-images')
                .upload(fileName, buffer, { contentType: juniorImageFile.type });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('meal-images').getPublicUrl(data.path);
            junior_box_lunch_image_url = publicUrl;
        }

        // Sandwich uses main image_url directly

        console.log('[updateMeal] Final URLs being saved:', { image_url, box_lunch_image_url, junior_box_lunch_image_url });

        const updates = {
            name,
            description,
            price: parseFloat(price),
            box_includes: box_includes,
            category,
            lunch_package,
            allow_split_box,
            is_active,
            image_url,
            box_lunch_image_url,
            junior_price: juniorPrice ? parseFloat(juniorPrice) : null,
            junior_box_includes: juniorBoxIncludes,
            junior_box_lunch_image_url,
            sandwich_price: sandwichPrice ? parseFloat(sandwichPrice) : null,
            sandwich_image_url: null
        };

        const { data, error } = await supabase
            .from('meals')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        await logActivity({
            userRole: 'admin',
            action: 'meal_updated',
            entityType: 'meal',
            entityId: id,
            details: { name: updates.name, changes: updates },
        });

        return { success: true, data };
    } catch (err: any) {
        console.error('[updateMeal] Error:', err);
        return { success: false, error: err?.message || 'Failed to update meal' };
    }
}

export async function deleteMeal(id: string) {
    const supabase = createAdminClient();

    // Get meal name before deleting for the log
    const { data: meal } = await supabase
        .from('meals')
        .select('name')
        .eq('id', id)
        .single();

    const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }

    await logActivity({
        userRole: 'admin',
        action: 'meal_deleted',
        entityType: 'meal',
        entityId: id,
        details: { name: meal?.name },
    });

    return { success: true };
}

export async function toggleMealActive(id: string, isActive: boolean) {
    const supabase = createAdminClient();

    const { error } = await supabase
        .from('meals')
        .update({ is_active: isActive })
        .eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }

    await logActivity({
        userRole: 'admin',
        action: isActive ? 'meal_activated' : 'meal_deactivated',
        entityType: 'meal',
        entityId: id,
    });

    return { success: true };
}

export async function updateMealSortOrder(id: string, newOrder: number) {
    const supabase = createAdminClient();

    const { error } = await supabase
        .from('meals')
        .update({ sort_order: newOrder })
        .eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}
