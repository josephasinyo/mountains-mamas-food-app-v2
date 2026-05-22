'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/supabase/activity-log';
import { revalidatePath } from 'next/cache';

const GLOBAL_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

export async function getGlobalSettings() {
    try {
        const supabase = createAdminClient();
        
        const { data: settings, error } = await supabase
            .from('app_settings')
            .select('*')
            .eq('id', GLOBAL_SETTINGS_ID)
            .single();
            
        if (error) throw error;
        
        return { success: true, settings };
    } catch (error: any) {
        console.error('Error fetching global settings:', error);
        return { success: false, error: error.message };
    }
}

export async function updateGlobalSettings(updates: { bread_options?: string[], cookie_options?: string[] }) {
    try {
        const supabase = createAdminClient();
        
        const { error } = await supabase
            .from('app_settings')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', GLOBAL_SETTINGS_ID);
            
        if (error) throw error;
        
        await logActivity({
            userRole: 'admin',
            action: 'global_settings_updated',
            entityType: 'config',
            entityId: GLOBAL_SETTINGS_ID,
            details: updates
        });
        
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating global settings:', error);
        return { success: false, error: error.message };
    }
}

export async function getFormFieldDefinitions() {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('form_field_definitions')
            .select('*')
            .order('location', { ascending: true })
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });
        if (error) throw error;
        return { success: true, fields: data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function saveAllSettings(payload: {
    breadOptions: string[];
    cookieOptions: string[];
    fields: any[];
    deletedFieldIds: string[];
}) {
    try {
        const supabase = createAdminClient();
        
        // 1. Update app settings
        const { error: settingsError } = await supabase
            .from('app_settings')
            .update({
                bread_options: payload.breadOptions,
                cookie_options: payload.cookieOptions,
                updated_at: new Date().toISOString()
            })
            .eq('id', GLOBAL_SETTINGS_ID);
            
        if (settingsError) throw settingsError;

        // 2. Delete fields
        if (payload.deletedFieldIds.length > 0) {
            const { error: deleteError } = await supabase
                .from('form_field_definitions')
                .delete()
                .in('id', payload.deletedFieldIds);
            if (deleteError) throw deleteError;
        }

        // 3. Upsert fields
        if (payload.fields.length > 0) {
            const fieldsToUpsert = payload.fields.map(f => {
                const isTempId = f.id && (String(f.id).startsWith('temp_') || String(f.id).startsWith('new_'));
                return {
                    ...(isTempId ? {} : { id: f.id }),
                    name: f.name,
                    label: f.label,
                    placeholder: f.placeholder || null,
                    type: f.type,
                    location: f.location,
                    is_required: !!f.is_required,
                    default_options: f.default_options || [],
                    is_active: f.is_active !== false,
                    sort_order: parseInt(f.sort_order) || 0,
                    auto_add: !!f.auto_add,
                    is_system_core: !!f.is_system_core
                };
            });

            const { error: upsertError } = await supabase
                .from('form_field_definitions')
                .upsert(fieldsToUpsert);
                
            if (upsertError) throw upsertError;
        }

        await logActivity({
            userRole: 'admin',
            action: 'global_settings_and_fields_updated',
            entityType: 'config',
            entityId: GLOBAL_SETTINGS_ID,
            details: {
                breads_count: payload.breadOptions.length,
                cookies_count: payload.cookieOptions.length,
                fields_count: payload.fields.length,
                deleted_count: payload.deletedFieldIds.length
            }
        });

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        console.error('Error saving all settings:', error);
        return { success: false, error: error.message };
    }
}

export async function upsertFormField(field: any) {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('form_field_definitions')
            .upsert(field)
            .select()
            .single();
        if (error) throw error;
        revalidatePath('/admin/settings');
        return { success: true, field: data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteFormField(id: string) {
    try {
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('form_field_definitions')
            .delete()
            .eq('id', id);
        if (error) throw error;
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

